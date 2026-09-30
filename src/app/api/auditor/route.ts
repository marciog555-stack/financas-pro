import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMonth } from '@/lib/month'
import { fmtCurrency, fmtDate } from '@/lib/format'

export const runtime = 'nodejs'
export const maxDuration = 300

const REVIEW_TOOL: Anthropic.Tool = {
  name: 'update_expense_review',
  description:
    'Atualiza o status de revisão de uma ou mais despesas do mês. Use action "flag" para marcar uma despesa como pendente de explicação (ela some dos relatórios até ser resolvida) — só para gastos genuinamente vagos, incomuns ou fora do padrão. Use action "resolve" quando o responsável já deu uma explicação satisfatória pra uma despesa marcada anteriormente.',
  input_schema: {
    type: 'object',
    properties: {
      updates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            expense_id: { type: 'string', description: 'O "id" da despesa, exatamente como aparece nos dados fornecidos.' },
            action: { type: 'string', enum: ['flag', 'resolve'] },
            note: {
              type: 'string',
              description:
                'Se action=flag: a pergunta direta e específica pro responsável sobre esse gasto. Se action=resolve: um resumo curto da explicação aceita.',
            },
          },
          required: ['expense_id', 'action', 'note'],
          additionalProperties: false,
        },
      },
    },
    required: ['updates'],
    additionalProperties: false,
  },
}

const CREATE_TOOL: Anthropic.Tool = {
  name: 'register_transactions',
  description:
    'Cria despesas e/ou rendas novas no sistema a partir de lançamentos do EXTRATO BANCÁRIO ANEXADO que não têm correspondência no que já está cadastrado. Prefira registrar a apenas perguntar: se não souber pra onde foi um gasto ou de onde veio uma renda, registre mesmo assim com needs_review=true e uma nota explicando — isso funciona como um alerta de "furo de caixa" que o responsável revisa e completa depois, sem bloquear o registro.',
  input_schema: {
    type: 'object',
    properties: {
      expenses: {
        type: 'array',
        description: 'Novas despesas (saídas do extrato) a criar',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome/descrição da despesa — use a descrição do extrato, ou algo mais claro se conseguir identificar (ex: "Uber", "iFood")' },
            amount: { type: 'number' },
            date: { type: 'string', description: 'Data no formato AAAA-MM-DD' },
            category: { type: 'string', description: 'Chave de uma das categorias já cadastradas (ver CATEGORIAS no contexto); se não souber, use "other"' },
            owner_profile_id: { type: 'string', description: 'ID de um dos MEMBROS DA CASA fornecidos no contexto; omita se for compartilhado ou não souber' },
            needs_review: { type: 'boolean', description: 'true se não está claro pra onde foi esse dinheiro (furo de caixa) — nesse caso "note" é obrigatório' },
            note: { type: 'string', description: 'Obrigatório se needs_review=true: comece com "Furo de caixa:" e explique o que falta esclarecer' },
          },
          required: ['name', 'amount', 'date', 'category', 'needs_review'],
          additionalProperties: false,
        },
      },
      incomes: {
        type: 'array',
        description: 'Novas rendas (entradas do extrato) a criar',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Origem da renda — nome da empresa/pessoa se identificável, ou a descrição do extrato' },
            amount: { type: 'number' },
            date: { type: 'string', description: 'Data no formato AAAA-MM-DD' },
            owner_profile_id: { type: 'string', description: 'ID de um dos MEMBROS DA CASA fornecidos no contexto; omita se não souber' },
            needs_review: { type: 'boolean', description: 'true se não está claro de onde veio esse dinheiro — nesse caso "note" é obrigatório' },
            note: { type: 'string', description: 'Obrigatório se needs_review=true: explique o que falta esclarecer sobre a origem' },
          },
          required: ['source', 'amount', 'date', 'needs_review'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Auditor IA não configurado neste ambiente.' }, { status: 501 })
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!profile?.household_id) {
    return NextResponse.json({ error: 'Casa financeira não encontrada.' }, { status: 400 })
  }
  const householdId = profile.household_id

  const body = await request.json().catch(() => null)
  const month = typeof body?.month === 'string' ? body.month : undefined
  const history: Anthropic.MessageParam[] = Array.isArray(body?.history) ? body.history : []
  if (history.length === 0) {
    return NextResponse.json({ error: 'Histórico da conversa vazio.' }, { status: 400 })
  }

  const rawStatement: unknown[] = Array.isArray(body?.statement) ? body.statement : []
  const statementData = rawStatement
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map((t: Record<string, unknown>) => ({
      data: typeof t.date === 'string' ? t.date : null,
      descricao: typeof t.description === 'string' ? t.description : '',
      valor: typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0,
      direcao: t.direction === 'entrada' ? 'entrada' : 'saida',
    }))
    .slice(0, 500)

  // '' = explicitamente compartilhado, string = id de um membro, undefined = não informado (extrato não anexado)
  const statementOwnerProfileId: string | undefined =
    typeof body?.statementOwnerProfileId === 'string' ? body.statementOwnerProfileId : undefined

  const { monthStart, monthEnd, monthLabelFull } = resolveMonth(month)

  const [{ data: expenses }, { data: incomes }, { data: benefitTx }, { data: members }, { data: categories }] =
    await Promise.all([
      supabase.from('expenses').select('*').eq('household_id', householdId).gte('due_date', monthStart).lte('due_date', monthEnd),
      supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', monthStart).lte('date', monthEnd),
      supabase
        .from('benefit_transactions')
        .select('*')
        .eq('household_id', householdId)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase.from('profiles').select('*').eq('household_id', householdId),
      supabase.from('expense_categories').select('*').eq('household_id', householdId),
    ])

  const nameById = new Map((members ?? []).map((m) => [m.id, m.name || 'Sem nome']))
  const ownerName = (id: string | null) => (id ? nameById.get(id) ?? 'Desconhecido' : 'Compartilhado')
  const categoryLabel = (key: string) => (categories ?? []).find((c) => c.key === key)?.label ?? key

  const expensesData = (expenses ?? []).map((e) => ({
    id: e.id,
    nome: e.name,
    valor: Number(e.amount),
    categoria: categoryLabel(e.category),
    responsavel: ownerName(e.owner_profile_id),
    vencimento: e.due_date,
    pago: Boolean(e.is_paid),
    fixa: Boolean(e.is_recurring),
    status_revisao: e.needs_review ? 'pendente_explicacao' : 'ok',
    nota: e.note,
  }))

  const incomesData = (incomes ?? []).map((i) => ({
    id: i.id,
    origem: i.source,
    valor: Number(i.amount),
    responsavel: ownerName(i.owner_profile_id),
    data: i.date,
    status_revisao: i.needs_review ? 'pendente_explicacao' : 'ok',
    nota: i.note,
  }))

  const membersData = (members ?? []).map((m) => ({ id: m.id, nome: m.name || 'Sem nome' }))
  const categoriesData = (categories ?? []).map((c) => ({ key: c.key, label: c.label }))

  const statementOwnerValid =
    statementOwnerProfileId === '' || (members ?? []).some((m) => m.id === statementOwnerProfileId)
  const statementOwnerResolved = statementOwnerValid ? statementOwnerProfileId : undefined
  const statementOwnerLabel =
    statementOwnerResolved === undefined ? null : statementOwnerResolved === '' ? 'Compartilhado' : ownerName(statementOwnerResolved)

  const benefitData = (benefitTx ?? []).map((t) => ({
    id: t.id,
    descricao: t.description,
    valor: Number(t.amount),
    categoria: t.category ? categoryLabel(t.category) : null,
    responsavel: ownerName(t.owner_profile_id),
    data: t.date,
  }))

  const totalExpense = expensesData.reduce((s, e) => s + e.valor, 0)
  const totalIncome = incomesData.reduce((s, i) => s + i.valor, 0)

  const systemPrompt = `Você é um auditor fiscal rigoroso, contratado pela casa financeira "${monthLabelFull}" pra conferir se cada real gasto está bem explicado. Você fala em português do Brasil, direto e profissional, mas educado.

Sua missão:
1. Analisar o extrato completo do mês (renda + despesas + gastos de benefícios abaixo) e entender como cada real/centavo foi gasto.
2. Questionar diretamente a pessoa responsável (chame pelo primeiro nome) quando um gasto for vago, incomum, mal categorizado, duplicado ou fora do padrão pra aquela categoria. NÃO questione gastos claros e bem descritos (ex: "Aluguel R$ 1800", "Mercado R$ 320") — só o que realmente precisar de explicação.
3. Quando você decidir que uma despesa precisa de explicação, chame a ferramenta update_expense_review com action="flag" pra essa despesa, com uma pergunta específica. Isso a esconde dos relatórios até ser resolvida.
4. Quando o usuário responder e a explicação for satisfatória, chame a ferramenta novamente com action="resolve" e um resumo curto da explicação — isso libera a despesa de volta pros relatórios. Se a explicação não for satisfatória, continue questionando (não resolva).
5. Nunca invente valores que não estejam nos dados fornecidos — todo valor, data e descrição deve vir do extrato ou do que já está cadastrado.
6. Seja objetivo: respostas curtas, diretas, sem enrolação. Uma visão geral quando pedido "analisar o mês", ou uma resposta pontual quando a pergunta for específica.${
    statementData.length > 0
      ? `
7. O usuário anexou um EXTRATO BANCÁRIO REAL (abaixo). Faça a conciliação: compare cada lançamento do extrato com o que já está cadastrado (DESPESAS, RENDA, GASTOS DE BENEFÍCIOS) por valor e data próxima. Para todo lançamento do extrato sem correspondência, REGISTRE no sistema usando a ferramenta register_transactions — não fique só perguntando em texto, o usuário prefere ver o lançamento já criado e revisar depois:
   - Saída sem correspondência: crie uma despesa (register_transactions.expenses). Se der pra identificar o que foi (nome de loja/serviço reconhecível na descrição), registre normal, sem needs_review. Se não estiver claro pra onde foi esse dinheiro, registre mesmo assim com needs_review=true e note começando com "Furo de caixa:" explicando o que falta esclarecer — isso vira um alerta pro responsável.
   - Entrada sem correspondência: crie uma renda (register_transactions.incomes). Se a descrição indicar claramente a origem (nome de empresa, "salário", etc.), registre normal. Se não estiver clara a origem, registre com needs_review=true e note explicando a dúvida (ex: "PIX recebido de CPF/nome desconhecido, origem não identificada").
   - owner_profile_id: ${
     statementOwnerLabel
       ? `este extrato é do(a) ${statementOwnerLabel} — o sistema já vai atribuir automaticamente todos os lançamentos criados a partir dele a essa pessoa, então não precisa se preocupar com esse campo.`
       : 'use o id de um dos MEMBROS DA CASA se a descrição indicar claramente de quem é (ex: nome da pessoa no PIX, cartão de uma pessoa específica); senão omita (fica compartilhado).'
   }
   - category: escolha a categoria mais adequada dentre CATEGORIAS; se não souber, use "other".
   - Depois de registrar, resuma em texto o que foi criado (quantas despesas, quantas rendas, quantas ficaram como furo de caixa/pendentes) — não repita cada lançamento em detalhe, só o resumo.
   - Não use update_expense_review para itens do extrato — essa ferramenta é só para despesas que já existiam antes.`
      : ''
  }

Resumo do mês (já cadastrado no sistema):
- Total de renda: ${fmtCurrency(totalIncome)}
- Total de despesas: ${fmtCurrency(totalExpense)}

MEMBROS DA CASA:
${JSON.stringify(membersData, null, 0)}

CATEGORIAS (despesas):
${JSON.stringify(categoriesData, null, 0)}

RENDA (${incomesData.length} lançamentos):
${JSON.stringify(incomesData, null, 0)}

DESPESAS (${expensesData.length} lançamentos):
${JSON.stringify(expensesData, null, 0)}

GASTOS DE BENEFÍCIOS/VALE (${benefitData.length} lançamentos):
${JSON.stringify(benefitData, null, 0)}
${
  statementData.length > 0
    ? `
EXTRATO BANCÁRIO ANEXADO PELO USUÁRIO (${statementData.length} lançamentos, ainda não conciliados com o sistema):
${JSON.stringify(statementData, null, 0)}`
    : ''
}

Datas de referência: hoje é ${fmtDate(new Date().toISOString().slice(0, 10))}.`

  let message: Anthropic.Message
  try {
    const anthropic = new Anthropic()
    const stream = anthropic.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 24000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemPrompt,
      tools: [REVIEW_TOOL, CREATE_TOOL],
      messages: history,
    })
    message = await stream.finalMessage()
  } catch (err) {
    console.error('Auditor IA error', err)
    return NextResponse.json({ error: 'Não foi possível falar com o auditor agora.' }, { status: 502 })
  }

  if (message.stop_reason === 'max_tokens') {
    return NextResponse.json(
      {
        error:
          'A resposta ficou grande demais pra processar de uma vez (extrato com muitos lançamentos). Tente pedir a conciliação de um período menor, ou peça "continue" pra tentar de novo.',
      },
      { status: 422 }
    )
  }

  const toolUses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  let flaggedCount = 0
  let createdExpenseCount = 0
  let createdIncomeCount = 0
  let furoCaixaCount = 0

  const validOwnerIds = new Set((members ?? []).map((m) => m.id))
  const validCategoryKeys = new Set((categories ?? []).map((c) => c.key))
  const toolResults: Anthropic.ToolResultBlockParam[] = []

  for (const toolUse of toolUses) {
    if (toolUse.name === 'update_expense_review') {
      const input = toolUse.input as { updates?: { expense_id: string; action: 'flag' | 'resolve'; note: string }[] }
      for (const update of input.updates ?? []) {
        const needsReview = update.action === 'flag'
        const { error } = await supabase
          .from('expenses')
          .update({ needs_review: needsReview, note: update.note })
          .eq('id', update.expense_id)
          .eq('household_id', householdId)
        if (!error && needsReview) flaggedCount++
      }
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: 'Atualizado com sucesso.' })
    } else if (toolUse.name === 'register_transactions') {
      const input = toolUse.input as {
        expenses?: { name: string; amount: number; date: string; category?: string; owner_profile_id?: string; needs_review?: boolean; note?: string }[]
        incomes?: { source: string; amount: number; date: string; owner_profile_id?: string; needs_review?: boolean; note?: string }[]
      }

      const newExpenses = (input.expenses ?? []).map((e) => ({
        household_id: householdId,
        name: e.name,
        amount: e.amount,
        category: e.category && validCategoryKeys.has(e.category) ? e.category : 'other',
        due_date: e.date,
        owner_profile_id:
          statementOwnerResolved !== undefined
            ? statementOwnerResolved || null
            : e.owner_profile_id && validOwnerIds.has(e.owner_profile_id)
              ? e.owner_profile_id
              : null,
        is_paid: true,
        is_recurring: false,
        needs_review: Boolean(e.needs_review),
        note: e.needs_review ? e.note ?? null : null,
      }))
      const newIncomes = (input.incomes ?? []).map((i) => ({
        household_id: householdId,
        source: i.source,
        amount: i.amount,
        date: i.date,
        owner_profile_id:
          statementOwnerResolved !== undefined
            ? statementOwnerResolved || null
            : i.owner_profile_id && validOwnerIds.has(i.owner_profile_id)
              ? i.owner_profile_id
              : null,
        is_recurring: false,
        needs_review: Boolean(i.needs_review),
        note: i.needs_review ? i.note ?? null : null,
      }))

      if (newExpenses.length > 0) {
        const { error } = await supabase.from('expenses').insert(newExpenses)
        if (!error) {
          createdExpenseCount += newExpenses.length
          furoCaixaCount += newExpenses.filter((e) => e.needs_review).length
        }
      }
      if (newIncomes.length > 0) {
        const { error } = await supabase.from('incomes').insert(newIncomes)
        if (!error) {
          createdIncomeCount += newIncomes.length
          furoCaixaCount += newIncomes.filter((i) => i.needs_review).length
        }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Registrado: ${newExpenses.length} despesa(s), ${newIncomes.length} renda(s).`,
      })
    }
  }

  const newHistory: Anthropic.MessageParam[] = [...history, { role: 'assistant', content: message.content }]
  if (toolResults.length > 0) {
    newHistory.push({ role: 'user', content: toolResults })
  }

  const replyText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n')

  return NextResponse.json({
    history: newHistory,
    reply: replyText,
    flaggedCount,
    createdExpenseCount,
    createdIncomeCount,
    furoCaixaCount,
  })
}
