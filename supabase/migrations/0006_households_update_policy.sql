-- A tabela households só tinha política de leitura (select). Isso fazia
-- qualquer update (foto do casal, nome da casa, limite mensal) falhar
-- silenciosamente — o RLS bloqueava a atualização sem gerar erro.

create policy "household members can update household" on households
  for update using (is_household_member(id)) with check (is_household_member(id));
