import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_payslip',
  description: 'Extrai os dados estruturados de um contracheque (holerite).',
  input_schema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'Descrição curta da origem (ex: "Salário Empresa X", "Contracheque julho/2026")' },
      date: { type: 'string', description: 'Data de pagamento no formato AAAA-MM-DD. Se não houver dia exato, use o último dia do mês de referência.' },
      gross_amount: { type: 'number', description: 'Valor bruto (total de vencimentos, antes dos descontos), em reais' },
      net_amount: { type: 'number', description: 'Valor líquido efetivamente recebido (total de vencimentos menos descontos), em reais' },
      deductions: {
        type: 'array',
        description: 'Lista dos descontos do contracheque (ex: INSS, IRRF, vale-transporte, plano de saúde)',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'Nome do desconto (ex: "INSS", "IRRF", "Vale-transporte")' },
            amount: { type: 'number', description: 'Valor do desconto, em reais' },
          },
          required: ['label', 'amount'],
          additionalProperties: false,
        },
      },
    },
    required: ['source', 'date', 'gross_amount', 'net_amount', 'deductions'],
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
    message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_payslip' },
      messages: [
        {
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: documentBlock as Anthropic.Base64PDFSource }
              : { type: 'image', source: documentBlock as Anthropic.ImageBlockParam['source'] },
            {
              type: 'text',
              text: 'Extraia os dados deste contracheque: valor bruto, valor líquido recebido e o detalhamento de cada desconto.',
            },
          ],
        },
      ],
    })
  } catch (err) {
    console.error('Anthropic extraction error', err)
    return NextResponse.json({ error: 'Falha ao processar o documento com IA.' }, { status: 502 })
  }

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  )
  if (!toolUse) {
    return NextResponse.json(
      { error: 'Não foi possível extrair os dados do documento.' },
      { status: 422 }
    )
  }

  return NextResponse.json(toolUse.input)
}
