create table if not exists public.career_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  career_id uuid not null,
  career_payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, career_id)
);

create index if not exists career_saves_updated_at_idx
  on public.career_saves (user_id, updated_at desc);

alter table public.career_saves enable row level security;

grant select, insert, update, delete on public.career_saves to authenticated;

drop policy if exists "Players read their own careers" on public.career_saves;
create policy "Players read their own careers"
  on public.career_saves for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players create their own careers" on public.career_saves;
create policy "Players create their own careers"
  on public.career_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players update their own careers" on public.career_saves;
create policy "Players update their own careers"
  on public.career_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players delete their own careers" on public.career_saves;
create policy "Players delete their own careers"
  on public.career_saves for delete to authenticated
  using ((select auth.uid()) = user_id);
