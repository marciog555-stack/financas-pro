# Finanças Pro

Controle financeiro pessoal/casal: renda, despesas, benefícios (VR/VA/VT), empréstimos, metas de economia e relatórios.

## Stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Auth + Postgres com Row Level Security)
- [Recharts](https://recharts.org) para os relatórios

## Rodando localmente

1. Copie `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Supabase:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

2. Instale as dependências e rode o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados

O schema (tabelas `profiles`, `households`, `incomes`, `expenses`, `benefit_cards`, `benefit_transactions`, `loans`, `loan_installments`, `goals`) está em [`supabase/migrations/0001_init_schema.sql`](./supabase/migrations/0001_init_schema.sql), com RLS habilitado — cada usuário só acessa os dados da sua `household` via `profiles.user_id`.

### Configurando um novo projeto Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com) (na conta que você quiser usar).
2. Vá em **SQL Editor** → **New query**, cole o conteúdo de `supabase/migrations/0001_init_schema.sql` e rode. Isso cria as tabelas, as políticas de RLS, as funções (`create_household`, `join_household`, `regenerate_invite_code`) e o bucket de storage `attachments`.
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.
4. Cole essas duas informações no `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — e nas variáveis de ambiente do deploy (Vercel), se aplicável.
5. Em **Authentication → URL Configuration**, configure a Site URL e as Redirect URLs (necessário para os links de "esqueci minha senha" funcionarem).

## Deploy

O projeto está pronto para deploy na [Vercel](https://vercel.com) (`vercel.json` na raiz). Configure as mesmas variáveis de ambiente do `.env.local` no painel do projeto.
