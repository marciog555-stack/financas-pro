-- Corrige os avisos de segurança/performance do Supabase advisor:
-- search_path mutável, políticas de RLS reavaliando auth.uid() por linha,
-- e índices faltando nas chaves estrangeiras.

create or replace function generate_invite_code()
returns text
language sql
set search_path = public
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using (user_id = (select auth.uid()));

drop policy if exists "view own profile or household profiles" on profiles;
create policy "view own profile or household profiles" on profiles
  for select using (user_id = (select auth.uid()) or is_household_member(household_id));

create index if not exists idx_benefit_cards_household_id on benefit_cards(household_id);
create index if not exists idx_benefit_cards_owner_profile_id on benefit_cards(owner_profile_id);
create index if not exists idx_benefit_transactions_benefit_card_id on benefit_transactions(benefit_card_id);
create index if not exists idx_benefit_transactions_household_id on benefit_transactions(household_id);
create index if not exists idx_benefit_transactions_owner_profile_id on benefit_transactions(owner_profile_id);
create index if not exists idx_expenses_household_id on expenses(household_id);
create index if not exists idx_expenses_owner_profile_id on expenses(owner_profile_id);
create index if not exists idx_goals_household_id on goals(household_id);
create index if not exists idx_incomes_household_id on incomes(household_id);
create index if not exists idx_incomes_owner_profile_id on incomes(owner_profile_id);
create index if not exists idx_loan_installments_household_id on loan_installments(household_id);
create index if not exists idx_loan_installments_loan_id on loan_installments(loan_id);
create index if not exists idx_loans_household_id on loans(household_id);
create index if not exists idx_loans_owner_profile_id on loans(owner_profile_id);
create index if not exists idx_profiles_household_id on profiles(household_id);
