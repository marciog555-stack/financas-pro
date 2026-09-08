-- Percentual de divisão de gastos por pessoa e limite de gastos mensal da casa
-- Rode no SQL Editor do mesmo projeto Supabase dos scripts anteriores

alter table profiles add column if not exists split_percentage numeric not null default 50;
alter table households add column if not exists monthly_budget numeric;
