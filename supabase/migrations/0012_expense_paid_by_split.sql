-- Permite registrar, no momento de marcar uma despesa como paga, quanto
-- cada pessoa da casa efetivamente pagou (útil pra contas compartilhadas
-- onde só uma pessoa adiantou o valor naquele dia).

alter table expenses add column if not exists paid_by jsonb;
