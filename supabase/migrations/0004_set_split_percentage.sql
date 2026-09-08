-- Permite que um membro da casa defina o percentual de divisão dos gastos,
-- ajustando o(s) outro(s) membro(s) para o complemento (100 - meu%).
-- Necessário porque a política de RLS de "profiles" só deixa cada um
-- atualizar a própria linha diretamente.

create or replace function set_split_percentage(p_my_percentage numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_household_id uuid;
begin
  if p_my_percentage < 0 or p_my_percentage > 100 then
    raise exception 'invalid percentage';
  end if;

  select id, household_id into v_profile_id, v_household_id
  from profiles
  where user_id = auth.uid();

  if v_profile_id is null then
    raise exception 'profile not found';
  end if;

  update profiles set split_percentage = p_my_percentage where id = v_profile_id;
  update profiles set split_percentage = 100 - p_my_percentage
    where household_id = v_household_id and id <> v_profile_id;
end;
$$;
