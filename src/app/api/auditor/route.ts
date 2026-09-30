import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMonth } from '@/lib/month'
import { fmtCurrency, fmtDate } from '@/lib/format'

export const runtime = 'nodejs'
export const maxDuration = 60

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
  }))

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
5. Nunca invente valores ou dados que não estejam no extrato abaixo. Baseie toda observação nos números reais fornecidos.
6. Seja objetivo: respostas curtas, diretas, sem enrolação. Uma visão geral quando pedido "analisar o mês", ou uma resposta pontual quando a pergunta for específica.${
    statementData.length > 0
      ? `
7. O usuário anexou um EXTRATO BANCÁRIO REAL (abaixo). Faça a conciliação: compare cada lançamento do extrato com o que já está cadastrado no sistema (DESPESAS, RENDA, GASTOS DE BENEFÍCIOS). Para cada lançamento do extrato que você não conseguir casar com um lançamento já existente (por valor e data próxima), aponte isso claramente:
   - Saídas sem lançamento correspondente: liste o quê, quando, quanto, e pergunte pro responsável o que foi e se quer que seja registrado.
   - Entradas sem lançamento correspondente: identifique se parece salário/pagamento de empresa (descrição com nome de empresa, valor recorrente) ou renda extra/avulsa, e pergunte a origem.
   - Não marque isso como use da ferramenta update_expense_review — isso é só pra despesas já cadastradas. Pra itens do extrato, apenas relate em texto e pergunte.`
      : ''
  }

Resumo do mês (já cadastrado no sistema):
- Total de renda: ${fmtCurrency(totalIncome)}
- Total de despesas: ${fmtCurrency(totalExpense)}

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
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: systemPrompt,
      tools: [REVIEW_TOOL],
      messages: history,
    })
    message = await stream.finalMessage()
  } catch (err) {
    console.error('Auditor IA error', err)
    return NextResponse.json({ error: 'Não foi possível falar com o auditor agora.' }, { status: 502 })
  }

  const toolUse = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  let flaggedCount = 0

  if (toolUse) {
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
  }

  const newHistory: Anthropic.MessageParam[] = [...history, { role: 'assistant', content: message.content }]
  if (toolUse) {
    newHistory.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: 'Atualizado com sucesso.' }],
    })
  }

  const replyText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n')

  return NextResponse.json({ history: newHistory, reply: replyText, flaggedCount })
}
