create table if not exists public.quiz_results (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null,
  result text not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

grant select on public.quiz_results to authenticated;

drop policy if exists "Users can read their own quiz results" on public.quiz_results;
create policy "Users can read their own quiz results"
  on public.quiz_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
