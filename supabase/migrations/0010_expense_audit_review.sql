-- Suporte ao Auditor Fiscal IA: marca despesas que precisam de explicação
-- antes de aparecerem nos relatórios, e guarda a nota/pergunta da IA.

alter table expenses add column if not exists needs_review boolean not null default false;
alter table expenses add column if not exists note text;
