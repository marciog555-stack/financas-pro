-- Suporte ao Auditor IA registrar rendas extraídas do extrato bancário
-- que precisam de explicação (mesma lógica já usada em expenses).

alter table incomes add column if not exists needs_review boolean not null default false;
alter table incomes add column if not exists note text;
