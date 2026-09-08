-- Adiciona foto de perfil (individual) e foto do casal (household)
-- Rode no SQL Editor do projeto Supabase (o mesmo onde rodou o 0001)

alter table profiles add column if not exists avatar_path text;
alter table households add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "users can update own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "users can delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "household members can upload household photo" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'household'
    and is_household_member(((storage.foldername(name))[2])::uuid)
  );

create policy "household members can update household photo" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'household'
    and is_household_member(((storage.foldername(name))[2])::uuid)
  );

create policy "household members can delete household photo" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'household'
    and is_household_member(((storage.foldername(name))[2])::uuid)
  );
