-- Finanças Pro — schema inicial
-- Rode este script inteiro no SQL Editor do NOVO projeto Supabase
-- (Dashboard → SQL Editor → New query → colar → Run)

-- ============================================================
-- Tabelas
-- ============================================================

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  name text not null,
  amount numeric not null,
  category text not null,
  due_date date,
  is_paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  source text not null,
  amount numeric not null,
  gross_amount numeric,
  deductions jsonb,
  date date not null,
  is_recurring boolean default false,
  attachment_path text,
  created_at timestamptz default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  name text not null,
  total_amount numeric not null,
  monthly_payment numeric not null,
  interest_rate numeric not null,
  total_installments int not null,
  remaining_installments int not null,
  first_due_date date not null default current_date,
  attachment_path text,
  created_at timestamptz default now()
);

create table if not exists loan_installments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  loan_id uuid not null references loans(id) on delete cascade,
  number int not null,
  amount numeric not null,
  due_date date not null,
  is_paid boolean not null default false,
  paid_date date,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date date,
  color text,
  created_at timestamptz default now()
);

create table if not exists benefit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists benefit_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  benefit_card_id uuid not null references benefit_cards(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  description text not null,
  amount numeric not null,
  category text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Funções (RPC usadas pelo app: onboarding e convites)
-- ============================================================

create or replace function is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and household_id = p_household_id
  );
$$;

create or replace function generate_invite_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

create or replace function create_household(p_household_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  loop
    v_code := generate_invite_code();
    begin
      insert into households (name, invite_code)
      values (p_household_name, v_code)
      returning id into v_household_id;
      exit;
    exception when unique_violation then
      -- código já existe, tenta outro
    end;
  end loop;

  insert into profiles (user_id, household_id, name)
  values (auth.uid(), v_household_id, p_display_name)
  on conflict (user_id) do update
    set household_id = excluded.household_id, name = excluded.name;

  return v_household_id;
end;
$$;

create or replace function join_household(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_household_id
  from households
  where invite_code = upper(p_invite_code);

  if v_household_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into profiles (user_id, household_id, name)
  values (auth.uid(), v_household_id, p_display_name)
  on conflict (user_id) do update
    set household_id = excluded.household_id, name = excluded.name;

  return v_household_id;
end;
$$;

create or replace function regenerate_invite_code(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not is_household_member(p_household_id) then
    raise exception 'not a member of this household';
  end if;

  loop
    v_code := generate_invite_code();
    begin
      update households set invite_code = v_code where id = p_household_id;
      exit;
    exception when unique_violation then
      -- código já existe, tenta outro
    end;
  end loop;

  return v_code;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households enable row level security;
alter table profiles enable row level security;
alter table expenses enable row level security;
alter table incomes enable row level security;
alter table loans enable row level security;
alter table loan_installments enable row level security;
alter table goals enable row level security;
alter table benefit_cards enable row level security;
alter table benefit_transactions enable row level security;

create policy "household members can view household" on households
  for select using (is_household_member(id));

create policy "view own profile or household profiles" on profiles
  for select using (user_id = auth.uid() or is_household_member(household_id));

create policy "update own profile" on profiles
  for update using (user_id = auth.uid());

create policy "household members can manage expenses" on expenses
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage incomes" on incomes
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage loans" on loans
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage loan_installments" on loan_installments
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage goals" on goals
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage benefit_cards" on benefit_cards
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

create policy "household members can manage benefit_transactions" on benefit_transactions
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- ============================================================
-- Storage (anexos de comprovantes de renda/empréstimo)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "users can read own attachments" on storage.objects
  for select using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can upload own attachments" on storage.objects
  for insert with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update own attachments" on storage.objects
  for update using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete own attachments" on storage.objects
  for delete using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
