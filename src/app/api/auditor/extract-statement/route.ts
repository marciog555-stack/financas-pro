import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_bank_statement',
  description: 'Extrai todos os lançamentos (entradas e saídas) de um extrato bancário ou fatura.',
  input_schema: {
    type: 'object',
    properties: {
      bank_label: { type: 'string', description: 'Nome do banco/conta, se identificável (ex: "Nubank", "Banco do Brasil")' },
      transactions: {
        type: 'array',
        description: 'Todos os lançamentos do extrato, na ordem em que aparecem',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Data do lançamento no formato AAAA-MM-DD' },
            description: { type: 'string', description: 'Descrição/histórico do lançamento exatamente como aparece no extrato' },
            amount: { type: 'number', description: 'Valor absoluto do lançamento, em reais (sempre positivo)' },
            direction: { type: 'string', enum: ['entrada', 'saida'], description: '"entrada" para crédito/recebimento, "saida" para débito/pagamento' },
          },
          required: ['date', 'description', 'amount', 'direction'],
          additionalProperties: false,
        },
      },
    },
    required: ['transactions'],
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
    return NextResponse.json(
      { error: 'Extração por IA não configurada neste ambiente.' },
      { status: 501 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const base64 = bytes.toString('base64')
  const isPdf = file.type === 'application/pdf'

  if (!isPdf && !SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Envie um PDF ou uma imagem (JPEG, PNG, GIF ou WebP).' },
      { status: 400 }
    )
  }

  const documentBlock: Anthropic.Base64PDFSource | Anthropic.ImageBlockParam['source'] = isPdf
    ? { type: 'base64', media_type: 'application/pdf', data: base64 }
    : { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 }

  const anthropic = new Anthropic()

  let message: Anthropic.Message
  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_bank_statement' },
      messages: [
        {
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: documentBlock as Anthropic.Base64PDFSource }
              : { type: 'image', source: documentBlock as Anthropic.ImageBlockParam['source'] },
            {
              type: 'text',
              text: 'Extraia todos os lançamentos (entradas e saídas) deste extrato bancário, na ordem em que aparecem.',
            },
          ],
        },
      ],
    })
    message = await stream.finalMessage()
  } catch (err) {
    console.error('Anthropic statement extraction error', err)
    return NextResponse.json(
      { error: 'Falha ao processar o extrato com IA. Tente novamente ou envie um arquivo menor (ex: só o mês desejado).' },
      { status: 502 }
    )
  }

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  )
  if (!toolUse || message.stop_reason === 'max_tokens') {
    return NextResponse.json(
      { error: 'O extrato é muito extenso pra ler de uma vez. Tente enviar um período menor (ex: só um mês por vez).' },
      { status: 422 }
    )
  }

  return NextResponse.json(toolUse.input)
}
