-- Despesas fixas: quando marcada, a conta é recriada automaticamente
-- no mês seguinte (mesmo valor, categoria e dono) assim que o app
-- é aberto vendo aquele mês.

alter table expenses add column if not exists is_recurring boolean not null default false;
