require("reflect-metadata");
const assert = require("node:assert/strict");
const test = require("node:test");
const { Module } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");

const { AccountService } = require("../dist/account/account.service.js");
const { AccountController } = require("../dist/account/account.controller.js");
const { ResultsController, ShareController } = require("../dist/results/results.controller.js");
const { ResultsService } = require("../dist/results/results.service.js");
const { SupabaseService } = require("../dist/supabase/supabase.service.js");
const { AllExceptionsFilter } = require("../dist/common/all-exceptions.filter.js");
const { resetRateLimits } = require("../dist/common/rate-limit.guard.js");

const UUID = "11111111-1111-4111-8111-111111111111";

function makeAccount({ owned = true, mentorFails = false, authError = null } = {}) {
  const calls = [];
  const results = {
    findOwned: async () => (owned ? { id: UUID } : null),
    deleteOwned: async (id, uid) => (calls.push(`results.deleteOwned:${id}:${uid}`), true),
    deleteAllByUser: async (uid) => (calls.push(`results.deleteAll:${uid}`), 2),
  };
  const mentor = {
    deleteByResult: async (id, uid) => calls.push(`mentor.deleteByResult:${id}:${uid}`),
    deleteAllByUser: async (uid) => {
      if (mentorFails) throw new Error("db");
      calls.push(`mentor.deleteAll:${uid}`);
    },
  };
  const supabase = { client: { auth: { admin: { deleteUser: async (uid) => (calls.push(`auth.deleteUser:${uid}`), { error: authError }) } } } };
  return { service: new AccountService(supabase, results, mentor), calls };
}

test("deleteResult: najpierw rozmowa z mentorem, potem wynik, z filtrem po użytkowniku", async () => {
  const { service, calls } = makeAccount();
  await service.deleteResult("u1", UUID);
  assert.deepEqual(calls, [`mentor.deleteByResult:${UUID}:u1`, `results.deleteOwned:${UUID}:u1`]);
});

test("deleteResult: cudzy lub nieistniejący wynik = 404 i nic nie jest kasowane", async () => {
  const { service, calls } = makeAccount({ owned: false });
  await assert.rejects(() => service.deleteResult("u1", UUID), (e) => e.getStatus() === 404);
  assert.deepEqual(calls, []);
});

test("deleteAccount: mentor -> wyniki -> konto logowania (w tej kolejności)", async () => {
  const { service, calls } = makeAccount();
  await service.deleteAccount("u1");
  assert.deepEqual(calls, ["mentor.deleteAll:u1", "results.deleteAll:u1", "auth.deleteUser:u1"]);
});

test("deleteAccount: błąd bazy zatrzymuje proces przed usunięciem konta logowania", async () => {
  const { service, calls } = makeAccount({ mentorFails: true });
  await assert.rejects(() => service.deleteAccount("u1"));
  assert.equal(calls.some((c) => c.startsWith("auth.deleteUser")), false);
});

test("deleteAccount: błąd usuwania konta = 500 z komunikatem, a brak użytkownika (404) = sukces", async () => {
  const failing = makeAccount({ authError: { status: 500, message: "boom" } });
  await assert.rejects(() => failing.service.deleteAccount("u1"), (e) => e.getStatus() === 500 && /nie udało się usunąć samego konta/.test(e.getResponse().error));

  const already = makeAccount({ authError: { status: 404, message: "User not found" } });
  await already.service.deleteAccount("u1");
});

test("kontroler wyników zwraca kształty z API.md (items, shareToken, card)", async () => {
  const row = { id: UUID, created_at: "2026-01-01", result: "porada", answers: [], profile: { archetype: { name: "A" }, traits: [], paths: [{ type: "safe", title: "T" }] }, share_token: null };
  let token = null;
  const repo = {
    listByUser: async () => [row],
    findOwned: async () => ({ ...row, share_token: token }),
    findByShareToken: async (t) => (t === token ? row : null),
    setShareToken: async (_id, _uid, t) => ((token = t), true),
  };
  const service = new ResultsService(repo);
  const c = new ResultsController(service, {}, {});
  const user = { id: "u1" };

  assert.deepEqual((await c.getResults(user)).items.map((i) => i.id), [UUID]);
  assert.equal((await c.getResultById(user, UUID)).ok, true);

  const shared = await c.shareResult(user, UUID);
  assert.equal(shared.ok, true);
  assert.match(shared.shareToken, /^[A-Za-z0-9_-]{16,}$/);
  assert.equal((await new ShareController(service).getSharedResult(shared.shareToken)).card.archetype.name, "A");

  assert.deepEqual(await c.unshareResult(user, UUID), { ok: true });
  await assert.rejects(() => new ShareController(service).getSharedResult(shared.shareToken), (e) => e.getStatus() === 404);
});

test("HTTP: DELETE /account wymaga potwierdzenia, DELETE /results/:id waliduje UUID, limit 3 usunięć konta", async () => {
  resetRateLimits();
  const calls = [];
  const fakeAccount = { deleteResult: async (u, id) => calls.push(["result", u, id]), deleteAccount: async (u) => calls.push(["account", u]) };
  const fakeSupabase = { client: { auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) } } };
  class M {}
  Module({ controllers: [AccountController], providers: [{ provide: AccountService, useValue: fakeAccount }, { provide: SupabaseService, useValue: fakeSupabase }] })(M);
  const app = await NestFactory.create(M, { logger: false });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(0);
  const base = `http://localhost:${app.getHttpServer().address().port}`;
  const call = (path, body, auth = true) =>
    fetch(base + path, { method: "DELETE", headers: { "content-type": "application/json", ...(auth && { authorization: "Bearer t" }) }, body: body && JSON.stringify(body) });

  try {
    assert.equal((await call("/account", { confirm: "USUŃ" }, false)).status, 401);
    assert.equal((await call("/account", {})).status, 400);
    assert.equal((await call("/account", { confirm: "tak" })).status, 400);
    assert.equal((await call("/account")).status, 400);
    assert.deepEqual(calls, []);

    resetRateLimits();
    const ok = await call("/account", { confirm: "USUŃ" });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { ok: true });
    assert.deepEqual(calls, [["account", "u1"]]);

    resetRateLimits();
    assert.equal((await call("/results/nie-uuid")).status, 400);
    assert.equal((await call(`/results/${UUID}`)).status, 200);
    assert.deepEqual(calls.at(-1), ["result", "u1", UUID]);

    resetRateLimits();
    for (let i = 0; i < 3; i++) assert.equal((await call("/account", { confirm: "USUŃ" })).status, 200);
    assert.equal((await call("/account", { confirm: "USUŃ" })).status, 429);
  } finally {
    await app.close();
  }
});
