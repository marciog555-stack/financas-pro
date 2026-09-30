'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Send, Sparkles, Loader2, Paperclip, X, FileCheck2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { Button, Card, Textarea } from '@/components/ui'
import { MonthNav } from '@/components/month-nav'
import { resolveMonth } from '@/lib/month'
import { fmtCurrency, fmtDate } from '@/lib/format'
import type { Tables } from '@/lib/database.types'

type Expense = Tables<'expenses'>
type Income = Tables<'incomes'>

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

type StatementTx = {
  date: string
  description: string
  amount: number
  direction: 'entrada' | 'saida'
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('A IA demorou demais pra responder. Tente de novo — se for um extrato grande, tente um período menor.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export default function AuditorPage() {
  const { household, members, categories } = useHousehold()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('m') ?? undefined
  const { year, month, monthStart, monthEnd, monthLabelFull, prevParam, nextParam } = resolveMonth(monthParam)
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([])
  const [pendingIncomes, setPendingIncomes] = useState<Income[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [history, setHistory] = useState<unknown[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statement, setStatement] = useState<{ fileName: string; bankLabel: string | null; transactions: StatementTx[] } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function loadPending() {
    setLoadingPending(true)
    const [{ data: expenseData }, { data: incomeData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('household_id', household.id)
        .eq('needs_review', true)
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd)
        .order('due_date', { ascending: false }),
      supabase
        .from('incomes')
        .select('*')
        .eq('household_id', household.id)
        .eq('needs_review', true)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false }),
    ])
    setPendingExpenses(expenseData ?? [])
    setPendingIncomes(incomeData ?? [])
    setLoadingPending(false)
  }

  useEffect(() => {
    loadPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart, monthEnd])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const categoryLabel = (key: string) => categories.find((c) => c.key === key)?.label ?? key

  async function handleAttach(file: File | null) {
    if (!file) return
    setExtracting(true)
    setExtractError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetchWithTimeout('/api/auditor/extract-statement', { method: 'POST', body }, 65000)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao extrair o extrato')
      const transactions: StatementTx[] = Array.isArray(data.transactions) ? data.transactions : []
      if (transactions.length === 0) throw new Error('Não encontrei lançamentos nesse arquivo.')
      setStatement({ fileName: file.name, bankLabel: data.bank_label ?? null, transactions })
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Falha ao extrair o extrato')
    } finally {
      setExtracting(false)
    }
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setError(null)
    const newHistory = [...history, { role: 'user', content: trimmed }]
    setHistory(newHistory)
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setSending(true)
    try {
      const res = await fetchWithTimeout(
        '/api/auditor',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: monthKey, history: newHistory, statement: statement?.transactions ?? [] }),
        },
        280000
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível falar com o auditor agora.')
      setHistory(data.history ?? newHistory)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'Sem observações.' }])
      loadPending()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível falar com o auditor agora.')
      setMessages((prev) => prev.slice(0, -1))
      setHistory((prev) => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <ShieldCheck size={18} className="text-accent-blue" /> Auditor Fiscal IA
        </h2>
        <p className="text-sm text-foreground/45">Converse com a IA sobre os gastos do mês</p>
      </div>

      <MonthNav label={monthLabelFull} prevParam={prevParam} nextParam={nextParam} basePath="/auditor" />

      {!loadingPending && (pendingExpenses.length > 0 || pendingIncomes.length > 0) && (
        <Card className="flex flex-col gap-3 border-accent-orange/30 bg-accent-orange/5 animate-fade-in-up">
          <p className="text-sm font-medium text-foreground">
            {pendingExpenses.length + pendingIncomes.length}{' '}
            {pendingExpenses.length + pendingIncomes.length === 1 ? 'lançamento pendente de explicação' : 'lançamentos pendentes de explicação'}
          </p>
          <div className="flex flex-col divide-y divide-border">
            {pendingExpenses.map((e) => (
              <div key={`e-${e.id}`} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium">{e.name}</span>
                  <span className="shrink-0 font-mono text-sm text-accent-red">-{fmtCurrency(Number(e.amount))}</span>
                </div>
                <p className="text-xs text-foreground/45">
                  {categoryLabel(e.category)} · {ownerLabel(members, e.owner_profile_id)} · {fmtDate(e.due_date)}
                </p>
                {e.note && <p className="mt-0.5 text-xs italic text-accent-orange">&ldquo;{e.note}&rdquo;</p>}
              </div>
            ))}
            {pendingIncomes.map((i) => (
              <div key={`i-${i.id}`} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium">{i.source}</span>
                  <span className="shrink-0 font-mono text-sm text-accent-emerald">+{fmtCurrency(Number(i.amount))}</span>
                </div>
                <p className="text-xs text-foreground/45">
                  Renda · {ownerLabel(members, i.owner_profile_id)} · {fmtDate(i.date)}
                </p>
                {i.note && <p className="mt-0.5 text-xs italic text-accent-orange">&ldquo;{i.note}&rdquo;</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 animate-fade-in-up [animation-delay:80ms]">
        <div ref={scrollRef} className="flex max-h-[50vh] min-h-[200px] flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <ShieldCheck size={28} className="text-foreground/20" />
              <p className="max-w-xs text-sm text-foreground/45">
                Peça pro auditor analisar {monthLabelFull.toLowerCase()} ou pergunte sobre um gasto específico.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => send(`Analise o extrato de ${monthLabelFull} e me diga se algo precisa de explicação.`)}>
                  <Sparkles size={14} /> Analisar este mês
                </Button>
                {statement && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      send(
                        `Anexei o extrato bancário${statement.bankLabel ? ` do ${statement.bankLabel}` : ''} com ${statement.transactions.length} lançamentos. Concilie com o que já está no sistema e registre o que estiver faltando — se não souber pra onde foi um gasto ou de onde veio uma renda, registre mesmo assim como pendente (furo de caixa) pra eu revisar depois.`
                      )
                    }
                  >
                    <FileCheck2 size={14} /> Conciliar extrato anexado
                  </Button>
                )}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-accent-emerald text-white'
                    : 'bg-surface-2 text-foreground'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-foreground/45">
                <Loader2 size={14} className="animate-spin" />
                {statement && statement.transactions.length > 20
                  ? 'Conciliando extrato grande, pode levar alguns minutos...'
                  : 'Analisando...'}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-accent-red">{error}</p>}
        {extractError && <p className="text-xs text-accent-red">{extractError}</p>}

        {statement ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs">
            <FileCheck2 size={14} className="shrink-0 text-accent-emerald" />
            <span className="min-w-0 flex-1 truncate">
              {statement.fileName} · {statement.transactions.length} lançamentos
              {statement.bankLabel ? ` · ${statement.bankLabel}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setStatement(null)}
              className="shrink-0 text-foreground/30 hover:text-accent-red"
              aria-label="Remover extrato"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-foreground/50 transition-colors hover:border-accent-emerald/60 hover:text-accent-emerald">
            {extracting ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
            {extracting ? 'Lendo extrato...' : 'Anexar extrato bancário (PDF ou foto)'}
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              disabled={extracting}
              onChange={(e) => handleAttach(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="Pergunte sobre um gasto ou responda uma explicação pendente..."
            rows={1}
            className="max-h-32 resize-none"
          />
          <Button type="submit" disabled={sending || !input.trim()} className="shrink-0">
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </div>
  )
}
