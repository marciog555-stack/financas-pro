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

O schema (tabelas `profiles`, `incomes`, `expenses`, `benefit_cards`, `loans`, `goals`) já está aplicado no projeto Supabase configurado, com RLS habilitado — cada usuário só acessa seus próprios dados via `profiles.user_id`.

## Deploy

O projeto está pronto para deploy na [Vercel](https://vercel.com) (`vercel.json` na raiz). Configure as mesmas variáveis de ambiente do `.env.local` no painel do projeto.
