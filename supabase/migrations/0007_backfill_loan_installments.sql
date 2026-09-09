-- Os empréstimos nunca tiveram as parcelas individuais criadas na tabela
-- loan_installments (só existiam os totais na tabela loans). Isso preenche
-- as parcelas retroativamente pra cada empréstimo que ainda não tem nenhuma,
-- marcando como pagas as primeiras (total - restantes) parcelas.

insert into loan_installments (household_id, loan_id, number, amount, due_date, is_paid, paid_date)
select
  l.household_id,
  l.id,
  gs.n,
  l.monthly_payment,
  (l.first_due_date + ((gs.n - 1) * interval '1 month'))::date as due_date,
  gs.n <= (l.total_installments - l.remaining_installments) as is_paid,
  case when gs.n <= (l.total_installments - l.remaining_installments)
       then (l.first_due_date + ((gs.n - 1) * interval '1 month'))::date
       else null end as paid_date
from loans l
cross join lateral generate_series(1, l.total_installments) as gs(n)
where not exists (select 1 from loan_installments li where li.loan_id = l.id);
