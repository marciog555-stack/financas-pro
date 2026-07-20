import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_loan_terms',
  description: 'Extrai os termos estruturados de um contrato de empréstimo ou financiamento.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nome curto do empréstimo/financiamento (ex: "Financiamento veículo", "Empréstimo pessoal Banco X")' },
      total_amount: { type: 'number', description: 'Valor total financiado, em reais' },
      interest_rate: { type: 'number', description: 'Taxa de juros mensal em porcentagem (ex: 1.99 para 1,99% a.m.). Se só houver a taxa anual, converta para mensal.' },
      total_installments: { type: 'integer', description: 'Número total de parcelas do contrato' },
      monthly_payment: { type: 'number', description: 'Valor de cada parcela mensal, em reais' },
    },
    required: ['name', 'total_amount', 'interest_rate', 'total_installments', 'monthly_payment'],
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
      tool_choice: { type: 'tool', name: 'extract_loan_terms' },
      messages: [
        {
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: documentBlock as Anthropic.Base64PDFSource }
              : { type: 'image', source: documentBlock as Anthropic.ImageBlockParam['source'] },
            {
              type: 'text',
              text: 'Extraia os dados deste contrato de empréstimo ou financiamento.',
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
