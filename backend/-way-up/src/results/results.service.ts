import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { badRequest, notFound } from '../common/errors';
import { compareProfiles } from './compare';
import { ResultRow, ResultsRepository } from './results.repository';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

@Injectable()
export class ResultsService {
  constructor(private readonly repo: ResultsRepository) {}

  async list(userId: string) {
    const rows = await this.repo.listByUser(userId);
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      archetype: row.profile?.archetype ?? null,
      shared: row.share_token !== null,
    }));
  }

  async get(userId: string, id: string) {
    const row = await this.repo.findOwned(id, userId);
    if (!row) throw notFound('Nie znaleziono wyniku.');
    return {
      id: row.id,
      createdAt: row.created_at,
      result: row.result,
      answers: row.answers,
      profile: row.profile,
      shareToken: row.share_token,
    };
  }

  async share(userId: string, id: string): Promise<string> {
    const row = await this.repo.findOwned(id, userId);
    if (!row) throw notFound('Nie znaleziono wyniku.');
    if (!row.profile) throw badRequest('Ten wynik nie ma profilu, więc nie można go udostępnić.');
    if (row.share_token) return row.share_token;

    const token = randomBytes(16).toString('base64url');
    const updated = await this.repo.setShareToken(id, userId, token);
    if (!updated) throw notFound('Nie znaleziono wyniku.');
    return token;
  }

  async unshare(userId: string, id: string): Promise<void> {
    const updated = await this.repo.setShareToken(id, userId, null);
    if (!updated) throw notFound('Nie znaleziono wyniku.');
  }

  async publicCard(token: string) {
    const row = await this.findShared(token);
    const profile = row.profile!;
    return {
      archetype: profile.archetype,
      traits: profile.traits,
      paths: profile.paths.map(({ type, title }) => ({ type, title })),
      createdAt: row.created_at,
    };
  }

  async compare(userId: string, token: string, resultId?: string) {
    const friend = await this.findShared(token);

    const mine = resultId
      ? await this.repo.findOwned(resultId, userId)
      : await this.repo.findLatestWithProfile(userId);
    if (!mine?.profile) {
      throw notFound('Najpierw wypełnij quiz, żeby móc się porównać.');
    }

    return {
      ...compareProfiles(mine.profile, friend.profile!),
      me: { archetype: mine.profile.archetype },
      friend: { archetype: friend.profile!.archetype },
    };
  }

  private async findShared(token: string): Promise<ResultRow> {
    if (!TOKEN_PATTERN.test(token)) throw notFound('Nie znaleziono udostępnionego wyniku.');
    const row = await this.repo.findByShareToken(token);
    if (!row?.profile) throw notFound('Nie znaleziono udostępnionego wyniku.');
    return row;
  }
}
