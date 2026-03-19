-- ============================================================
-- Row Level Security
-- Принцип: пользователь видит только данные групп,
-- в которых он состоит.
-- Аутентификация: JWT от Telegram (через Supabase custom auth).
-- ============================================================

alter table public.users            enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.bills            enable row level security;
alter table public.bill_participants enable row level security;

-- Хелпер: UUID текущего пользователя из JWT-клейма
create or replace function public.current_user_id()
returns uuid language sql stable security definer as $$
  select id from public.users
  where telegram_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_id')::bigint
$$;

-- Хелпер: состоит ли текущий пользователь в группе?
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = public.current_user_id()
  )
$$;

-- ---------- users ----------
-- Каждый видит собственный профиль и профили участников своих групп

create policy "users: select own and group mates" on public.users
  for select using (
    id = public.current_user_id()
    or exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 using (group_id)
      where gm1.user_id = public.current_user_id()
        and gm2.user_id = users.id
    )
  );

create policy "users: insert own" on public.users
  for insert with check (telegram_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_id')::bigint);

create policy "users: update own" on public.users
  for update using (id = public.current_user_id());

-- ---------- groups ----------

create policy "groups: select member only" on public.groups
  for select using (public.is_group_member(id));

-- Создавать группы может сервис-роль (бот), не анонимные клиенты
create policy "groups: insert service role only" on public.groups
  for insert with check (false);  -- переопределяется service_role

-- ---------- group_members ----------

create policy "group_members: select own groups" on public.group_members
  for select using (public.is_group_member(group_id));

create policy "group_members: insert service role only" on public.group_members
  for insert with check (false);

-- ---------- bills ----------

create policy "bills: select group member" on public.bills
  for select using (public.is_group_member(group_id));

create policy "bills: insert group member" on public.bills
  for insert with check (
    public.is_group_member(group_id)
    and paid_by = public.current_user_id()
  );

create policy "bills: update payer only" on public.bills
  for update using (paid_by = public.current_user_id());

create policy "bills: delete payer only" on public.bills
  for delete using (paid_by = public.current_user_id());

-- ---------- bill_participants ----------

create policy "bill_participants: select via bill" on public.bill_participants
  for select using (
    exists (
      select 1 from public.bills b
      where b.id = bill_participants.bill_id
        and public.is_group_member(b.group_id)
    )
  );

-- Участники создаются только вместе со счётом (через функцию / service_role)
create policy "bill_participants: insert service role only" on public.bill_participants
  for insert with check (false);

-- Только сам участник отмечает свою оплату
create policy "bill_participants: update own payment" on public.bill_participants
  for update using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());
