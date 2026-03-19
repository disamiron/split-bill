-- ============================================================
-- Split Bill — Initial Schema
-- ============================================================

-- ---------- ENUMS ----------

create type split_type as enum ('equal', 'custom');
create type bill_status as enum ('active', 'settled');

-- ---------- TABLES ----------

-- Telegram users
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  telegram_id  bigint unique not null,
  username     text,
  first_name   text not null,
  last_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Telegram group chats
create table public.groups (
  id               uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint unique not null,
  title            text not null,
  created_at       timestamptz not null default now()
);

-- Group membership
create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.users(id)  on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Bills / expenses
create table public.bills (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups(id) on delete cascade,
  title             text not null,
  total_amount      numeric(12, 2) not null check (total_amount > 0),
  currency          text not null default 'RUB',
  paid_by           uuid not null references public.users(id),
  split_type        split_type not null default 'equal',
  receipt_image_url text,
  status            bill_status not null default 'active',
  created_at        timestamptz not null default now(),
  settled_at        timestamptz
);

-- Per-participant shares and payment status
create table public.bill_participants (
  id        uuid primary key default gen_random_uuid(),
  bill_id   uuid not null references public.bills(id) on delete cascade,
  user_id   uuid not null references public.users(id),
  share     numeric(12, 2) not null check (share >= 0),
  is_paid   boolean not null default false,
  paid_at   timestamptz,
  unique (bill_id, user_id)
);

-- ---------- INDEXES ----------

create index on public.bills(group_id);
create index on public.bills(status);
create index on public.bill_participants(bill_id);
create index on public.bill_participants(user_id, is_paid);
create index on public.group_members(user_id);

-- ---------- FUNCTIONS ----------

-- Auto-settle a bill when all participants have paid
create or replace function public.check_bill_settled()
returns trigger language plpgsql security definer as $$
declare
  unpaid_count int;
begin
  select count(*) into unpaid_count
  from public.bill_participants
  where bill_id = new.bill_id and is_paid = false;

  if unpaid_count = 0 then
    update public.bills
    set status = 'settled', settled_at = now()
    where id = new.bill_id;
  end if;

  return new;
end;
$$;

create trigger trg_check_bill_settled
after update of is_paid on public.bill_participants
for each row when (new.is_paid = true)
execute function public.check_bill_settled();

-- Upsert a Telegram user (called from bot/mini-app on every launch)
create or replace function public.upsert_telegram_user(
  p_telegram_id bigint,
  p_username    text,
  p_first_name  text,
  p_last_name   text,
  p_avatar_url  text default null
)
returns public.users language plpgsql security definer as $$
declare
  v_user public.users;
begin
  insert into public.users (telegram_id, username, first_name, last_name, avatar_url)
  values (p_telegram_id, p_username, p_first_name, p_last_name, p_avatar_url)
  on conflict (telegram_id) do update set
    username   = excluded.username,
    first_name = excluded.first_name,
    last_name  = excluded.last_name,
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
  returning * into v_user;

  return v_user;
end;
$$;
