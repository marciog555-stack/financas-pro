-- Categorias de despesa editáveis por casa (antes eram fixas no código)

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  key text not null,
  label text not null,
  emoji text not null default '📦',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, key)
);

alter table expense_categories enable row level security;

create policy "household members can manage expense_categories" on expense_categories
  for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- Semeia as categorias padrão sempre que uma casa nova é criada
create or replace function seed_default_expense_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into expense_categories (household_id, key, label, emoji, sort_order)
  values
    (new.id, 'rent', 'Aluguel', '🏠', 0),
    (new.id, 'water', 'Água', '💧', 1),
    (new.id, 'electricity', 'Energia', '⚡', 2),
    (new.id, 'internet', 'Internet', '📡', 3),
    (new.id, 'phone', 'Celular', '📱', 4),
    (new.id, 'market', 'Mercado', '🛒', 5),
    (new.id, 'transport', 'Transporte', '🚗', 6),
    (new.id, 'health', 'Saúde', '💊', 7),
    (new.id, 'leisure', 'Lazer', '🎉', 8),
    (new.id, 'other', 'Outros', '📦', 9)
  on conflict (household_id, key) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_default_expense_categories on households;
create trigger trg_seed_default_expense_categories
  after insert on households
  for each row execute function seed_default_expense_categories();

-- Preenche as casas que já existiam antes dessa migração
insert into expense_categories (household_id, key, label, emoji, sort_order)
select h.id, c.key, c.label, c.emoji, c.sort_order
from households h
cross join (values
  ('rent', 'Aluguel', '🏠', 0),
  ('water', 'Água', '💧', 1),
  ('electricity', 'Energia', '⚡', 2),
  ('internet', 'Internet', '📡', 3),
  ('phone', 'Celular', '📱', 4),
  ('market', 'Mercado', '🛒', 5),
  ('transport', 'Transporte', '🚗', 6),
  ('health', 'Saúde', '💊', 7),
  ('leisure', 'Lazer', '🎉', 8),
  ('other', 'Outros', '📦', 9)
) as c(key, label, emoji, sort_order)
on conflict (household_id, key) do nothing;
