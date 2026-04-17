'use client'

import { useState } from 'react'
import {
  Plus, X, Users, User, TrendingUp, Home, CreditCard,
  Target, DollarSign, Percent, Trash2, Calendar,
  BarChart2, CheckCircle2, AlertCircle, Wallet,
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
const uid = () => Math.random().toString(36).slice(2, 10)
const mono = { fontFamily: "'DM Mono', monospace" }

/* ── constants ───────────────────────────────────────────────────────────── */
const CAT = {
  rent:        { label: 'Aluguel',  emoji: '🏠' },
  water:       { label: 'Água',     emoji: '💧' },
  electricity: { label: 'Energia',  emoji: '⚡' },
  internet:    { label: 'Internet', emoji: '📡' },
  phone:       { label: 'Celular',  emoji: '📱' },
  other:       { label: 'Outros',   emoji: '📦' },
}
const GOAL_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']

/* ── seed ────────────────────────────────────────────────────────────────── */
const SEED = {
  incomes: [
    { id: uid(), source: 'Salário CLT',           amount: 5500,  date: '2025-04-05', isRecurring: true,  owner: 'me'      },
    { id: uid(), source: 'Freelance Design',       amount: 1200,  date: '2025-04-15', isRecurring: false, owner: 'me'      },
    { id: uid(), source: 'Salário – Parceiro(a)',  amount: 4800,  date: '2025-04-05', isRecurring: true,  owner: 'partner' },
  ],
  expenses: [
    { id: uid(), category: 'rent',        name: 'Aluguel Apartamento',  amount: 1800,  dueDate: '2025-04-05', isPaid: false, owner: 'shared' },
    { id: uid(), category: 'electricity', name: 'Conta de Luz',         amount: 180,   dueDate: '2025-04-10', isPaid: true,  owner: 'shared' },
    { id: uid(), category: 'internet',    name: 'Internet Fibra 300MB', amount: 99.90, dueDate: '2025-04-15', isPaid: false, owner: 'shared' },
    { id: uid(), category: 'water',       name: 'Conta de Água',        amount: 65,    dueDate: '2025-04-12', isPaid: false, owner: 'shared' },
    { id: uid(), category: 'phone',       name: 'Plano Celular',        amount: 59.90, dueDate: '2025-04-20', isPaid: false, owner: 'me'     },
  ],
  benefits: [
    { id: uid(), name: 'VR Sodexo', type: 'VR', balance: 420, owner: 'me'      },
    { id: uid(), name: 'VA Flash',  type: 'VA', balance: 280, owner: 'me'      },
    { id: uid(), name: 'VR Alelo',  type: 'VR', balance: 380, owner: 'partner' },
  ],
  loans: [
    { id: uid(), name: 'Notebook Parcelado', totalAmount: 4800,  interestRate: 1.99, totalInstallments: 12, remainingInstallments: 8,  monthlyPayment: 420, owner: 'me'      },
    { id: uid(), name: 'Empréstimo Pessoal', totalAmount: 15000, interestRate: 2.50, totalInstallments: 24, remainingInstallments: 18, monthlyPayment: 735, owner: 'partner' },
  ],
  goals: [
    { id: uid(), name: 'Viagem Europa 🌍',    currentAmount: 3200, targetAmount: 12000, targetDate: '2025-12-31', color: '#3B82F6' },
    { id: uid(), name: 'Fundo de Emergência', currentAmount: 8500, targetAmount: 15000, targetDate: '2025-09-30', color: '#10B981' },
    { id: uid(), name: 'Novo Celular 📱',      currentAmount: 600,  targetAmount: 2000,  targetDate: '2025-06-30', color: '#8B5CF6' },
  ],
}

/* ── shared ui ───────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-slate-400 text-sm mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors'

function OwnerToggle({ value, onChange, mode, allowShared = false }) {
  if (mode !== 'couple') return null
  const opts = allowShared
    ? [{ v: 'shared', l: 'Compartilhado' }, { v: 'me', l: 'Eu' }, { v: 'partner', l: 'Parceiro(a)' }]
    : [{ v: 'me', l: 'Eu' }, { v: 'partner', l: 'Parceiro(a)' }]
  return (
    <Field label="Responsável">
      <div className="flex gap-2">
        {opts.map(({ v, l }) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${value === v ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>
    </Field>
  )
}

function Bar({ pct, color = '#10B981' }) {
  return (
    <div className="w-full bg-slate-700/60 rounded-full h-2.5">
      <div className="h-2.5 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} />
    </div>
  )
}

function Badge({ children, color = 'slate' }) {
  const m = {
    emerald: 'bg-emerald-900/60 text-emerald-400 border border-emerald-800/50',
    blue:    'bg-blue-900/60 text-blue-400 border border-blue-800/50',
    amber:   'bg-amber-900/60 text-amber-400 border border-amber-800/50',
    red:     'bg-red-900/60 text-red-400 border border-red-800/50',
    slate:   'bg-slate-700/60 text-slate-300 border border-slate-600/50',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m[color] || m.slate}`}>{children}</span>
}

function SaveBtn({ onClick, label = 'Salvar' }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white py-3 rounded-xl font-semibold mt-2 transition-all">
      {label}
    </button>
  )
}

/* ── dashboard ───────────────────────────────────────────────────────────── */
function Dashboard({ incomes, expenses, benefits, loans, goals }) {
  const totalIncome   = incomes.reduce((a, b) => a + b.amount, 0)
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0)
  const net           = totalIncome - totalExpenses
  const loanMonthly   = loans.reduce((a, b) => a + b.monthlyPayment, 0)
  const loanRemaining = loans.reduce((a, b) => a + b.remainingInstallments * b.monthlyPayment, 0)
  const avgGoal       = goals.length ? goals.reduce((a, b) => a + (b.currentAmount / b.targetAmount) * 100, 0) / goals.length : 0
  const pending       = expenses.filter(e => !e.isPaid)

  const cards = [
    { label: 'Renda Total',     val: fmt(totalIncome),   Icon: TrendingUp, c: 'emerald', sub: `${incomes.length} fonte(s)` },
    { label: 'Despesas Fixas',  val: fmt(totalExpenses), Icon: Home,       c: 'amber',   sub: `${pending.length} pendente(s)` },
    { label: 'Saldo Líquido',   val: fmt(net),           Icon: DollarSign, c: net >= 0 ? 'emerald' : 'red', sub: net >= 0 ? '✓ positivo' : '✗ atenção!' },
    { label: 'Benefícios',      val: fmt(benefits.reduce((a, b) => a + b.balance, 0)), Icon: CreditCard, c: 'blue', sub: `${benefits.length} cartão(ões)` },
    { label: 'Parcelas/mês',    val: fmt(loanMonthly),   Icon: Percent,    c: 'red',     sub: `${fmt(loanRemaining)} restante` },
    { label: 'Progresso Metas', val: `${avgGoal.toFixed(0)}%`, Icon: Target, c: 'purple', sub: `${goals.length} meta(s)` },
  ]

  const pal = {
    emerald: { bg: 'bg-emerald-950/50', bd: 'border-emerald-800/40', ic: 'text-emerald-400', vl: 'text-emerald-300' },
    amber:   { bg: 'bg-amber-950/50',   bd: 'border-amber-800/40',   ic: 'text-amber-400',   vl: 'text-amber-300'   },
    red:     { bg: 'bg-red-950/50',     bd: 'border-red-800/40',     ic: 'text-red-400',     vl: 'text-red-300'     },
    blue:    { bg: 'bg-blue-950/50',    bd: 'border-blue-800/40',    ic: 'text-blue-400',    vl: 'text-blue-300'    },
    purple:  { bg: 'bg-purple-950/50',  bd: 'border-purple-800/40',  ic: 'text-purple-400',  vl: 'text-purple-300'  },
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(({ label, val, Icon, c, sub }) => {
          const p = pal[c] || pal.emerald
          return (
            <div key={label} className={`${p.bg} border ${p.bd} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-medium">{label}</span>
                <Icon size={15} className={p.ic} />
              </div>
              <div className={`font-bold text-lg ${p.vl}`} style={mono}>{val}</div>
              <div className="text-slate-500 text-xs mt-1">{sub}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-400" />
          Contas Pendentes
          <span className="ml-auto text-amber-400 text-sm" style={mono}>
            {fmt(pending.reduce((a, b) => a + b.amount, 0))}
          </span>
        </h3>
        {pending.length === 0
          ? <p className="text-slate-500 text-sm text-center py-4">Nenhuma conta pendente 🎉</p>
          : pending.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/80 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{CAT[e.category]?.emoji}</span>
                <div>
                  <p className="text-white text-sm font-medium">{e.name}</p>
                  {e.dueDate && <p className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={10} /> Vence {fmtDate(e.dueDate)}</p>}
                </div>
              </div>
              <span className="text-amber-400 font-bold text-sm" style={mono}>{fmt(e.amount)}</span>
            </div>
          ))}
      </div>

      {goals.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-emerald-400" /> Resumo das Metas
          </h3>
          <div className="space-y-4">
            {goals.map(g => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100)
              return (
                <div key={g.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-300 text-sm">{g.name}</span>
                    <span className="text-sm font-bold" style={{ ...mono, color: g.color }}>{pct.toFixed(0)}%</span>
                  </div>
                  <Bar pct={pct} color={g.color} />
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500 text-xs">{fmt(g.currentAmount)}</span>
                    <span className="text-slate-500 text-xs">{fmt(g.targetAmount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── income ──────────────────────────────────────────────────────────────── */
function IncomeTab({ incomes, setIncomes, mode }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ source: '', amount: '', date: '', isRecurring: false, owner: 'me' })
  const save = () => {
    if (!f.source.trim() || !f.amount || !f.date) return
    setIncomes(p => [...p, { ...f, id: uid(), amount: parseFloat(f.amount) }])
    setF({ source: '', amount: '', date: '', isRecurring: false, owner: 'me' })
    setOpen(false)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-400 text-sm">Renda total</p>
          <p className="text-emerald-400 font-bold text-2xl" style={mono}>{fmt(incomes.reduce((a, b) => a + b.amount, 0))}</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus size={16} /> Adicionar Renda
        </button>
      </div>
      <div className="space-y-3">
        {incomes.length === 0 && <p className="text-slate-500 text-center py-12 text-sm">Nenhuma renda cadastrada</p>}
        {incomes.map(inc => (
          <div key={inc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{inc.source}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={10} />{fmtDate(inc.date)}</span>
                <Badge color={inc.isRecurring ? 'emerald' : 'slate'}>{inc.isRecurring ? 'Recorrente' : 'Único'}</Badge>
                {mode === 'couple' && <Badge color="blue">{inc.owner === 'me' ? 'Eu' : 'Parceiro(a)'}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-emerald-400 font-bold" style={mono}>{fmt(inc.amount)}</span>
              <button onClick={() => setIncomes(p => p.filter(i => i.id !== inc.id))} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title="Nova Fonte de Renda" onClose={() => setOpen(false)}>
          <Field label="Origem / Fonte"><input className={inp} placeholder="Ex: Salário, Freelance..." value={f.source} onChange={e => setF(p => ({ ...p, source: e.target.value }))} /></Field>
          <Field label="Valor (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></Field>
          <Field label="Data de Recebimento"><input className={inp} type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="Frequência">
            <div className="flex gap-2">
              {[{ v: false, l: 'Único' }, { v: true, l: 'Recorrente' }].map(({ v, l }) => (
                <button key={l} type="button" onClick={() => setF(p => ({ ...p, isRecurring: v }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${f.isRecurring === v ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{l}</button>
              ))}
            </div>
          </Field>
          <OwnerToggle value={f.owner} onChange={v => setF(p => ({ ...p, owner: v }))} mode={mode} />
          <SaveBtn onClick={save} label="Salvar Renda" />
        </Modal>
      )}
    </div>
  )
}

/* ── expenses ────────────────────────────────────────────────────────────── */
function ExpensesTab({ expenses, setExpenses, mode }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ category: 'rent', name: '', amount: '', dueDate: '', isPaid: false, owner: 'shared' })
  const save = () => {
    if (!f.name.trim() || !f.amount) return
    setExpenses(p => [...p, { ...f, id: uid(), amount: parseFloat(f.amount) }])
    setF({ category: 'rent', name: '', amount: '', dueDate: '', isPaid: false, owner: 'shared' })
    setOpen(false)
  }
  const toggle = id => setExpenses(p => p.map(e => e.id === id ? { ...e, isPaid: !e.isPaid } : e))
  const del    = id => setExpenses(p => p.filter(e => e.id !== id))
  const pending = expenses.filter(e => !e.isPaid)
  const grouped = Object.keys(CAT).reduce((acc, k) => {
    const items = expenses.filter(e => e.category === k)
    if (items.length) acc[k] = items
    return acc
  }, {})
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-6">
          <div><p className="text-slate-400 text-xs">Total</p><p className="text-white font-bold text-lg" style={mono}>{fmt(expenses.reduce((a, b) => a + b.amount, 0))}</p></div>
          <div><p className="text-slate-400 text-xs">Pendente</p><p className="text-amber-400 font-bold text-lg" style={mono}>{fmt(pending.reduce((a, b) => a + b.amount, 0))}</p></div>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus size={16} /> Adicionar
        </button>
      </div>
      <div className="space-y-5">
        {Object.keys(CAT).filter(k => grouped[k]).map(cat => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xl">{CAT[cat].emoji}</span>
              <h4 className="text-slate-300 font-semibold text-sm">{CAT[cat].label}</h4>
              <span className="ml-auto text-slate-500 text-xs" style={mono}>{fmt(grouped[cat].reduce((a, b) => a + b.amount, 0))}</span>
            </div>
            <div className="space-y-2">
              {grouped[cat].map(exp => (
                <div key={exp.id} className={`border rounded-2xl p-4 flex items-center gap-3 transition-all ${exp.isPaid ? 'bg-slate-900/30 border-slate-800/50 opacity-55' : 'bg-slate-900 border-slate-800'}`}>
                  <button type="button" onClick={() => toggle(exp.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${exp.isPaid ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 hover:border-emerald-500'}`}>
                    {exp.isPaid && <CheckCircle2 size={13} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${exp.isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{exp.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {exp.dueDate && <span className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={10} />vence {fmtDate(exp.dueDate)}</span>}
                      {mode === 'couple' && <Badge color={exp.owner === 'shared' ? 'slate' : 'blue'}>{exp.owner === 'shared' ? 'Compartilhado' : exp.owner === 'me' ? 'Eu' : 'Parceiro(a)'}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-bold text-sm ${exp.isPaid ? 'text-emerald-600' : 'text-white'}`} style={mono}>{fmt(exp.amount)}</span>
                    <button onClick={() => del(exp.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {expenses.length === 0 && <p className="text-slate-500 text-center py-12 text-sm">Nenhuma despesa cadastrada</p>}
      </div>
      {open && (
        <Modal title="Nova Despesa" onClose={() => setOpen(false)}>
          <Field label="Categoria">
            <select className={inp} value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CAT).map(([k, { label, emoji }]) => <option key={k} value={k}>{emoji} {label}</option>)}
            </select>
          </Field>
          <Field label="Nome / Descrição"><input className={inp} placeholder="Ex: Conta de Luz" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Valor (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></Field>
          <Field label="Data de Vencimento"><input className={inp} type="date" value={f.dueDate} onChange={e => setF(p => ({ ...p, dueDate: e.target.value }))} /></Field>
          {mode === 'couple' && <OwnerToggle value={f.owner} onChange={v => setF(p => ({ ...p, owner: v }))} mode={mode} allowShared />}
          <SaveBtn onClick={save} label="Salvar Despesa" />
        </Modal>
      )}
    </div>
  )
}

/* ── benefits ────────────────────────────────────────────────────────────── */
function BenefitsTab({ benefits, setBenefits, mode }) {
  const [open, setOpen] = useState(false)
  const [adj, setAdj]   = useState({})
  const [f, setF] = useState({ name: '', type: 'VR', balance: '', owner: 'me' })
  const save = () => {
    if (!f.name.trim() || f.balance === '') return
    setBenefits(p => [...p, { ...f, id: uid(), balance: parseFloat(f.balance) }])
    setF({ name: '', type: 'VR', balance: '', owner: 'me' })
    setOpen(false)
  }
  const apply = id => {
    const v = parseFloat(adj[id] || 0)
    if (!v) return
    setBenefits(p => p.map(c => c.id === id ? { ...c, balance: Math.max(0, parseFloat((c.balance + v).toFixed(2))) } : c))
    setAdj(p => ({ ...p, [id]: '' }))
  }
  const typeColor = { VR: 'emerald', VA: 'blue', VT: 'amber', Other: 'slate' }
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-400 text-xs">Saldo total</p>
          <p className="text-emerald-400 font-bold text-2xl" style={mono}>{fmt(benefits.reduce((a, b) => a + b.balance, 0))}</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus size={16} /> Novo Cartão
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.length === 0 && <p className="text-slate-500 col-span-2 text-center py-12 text-sm">Nenhum cartão cadastrado</p>}
        {benefits.map(card => (
          <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge color={typeColor[card.type] || 'slate'}>{card.type}</Badge>
                  {mode === 'couple' && <Badge color="blue">{card.owner === 'me' ? 'Eu' : 'Parceiro(a)'}</Badge>}
                </div>
                <p className="text-white font-semibold">{card.name}</p>
              </div>
              <button onClick={() => setBenefits(p => p.filter(c => c.id !== card.id))} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={15} /></button>
            </div>
            <p className="text-3xl font-bold text-white mb-4" style={mono}>{fmt(card.balance)}</p>
            <div className="flex gap-2">
              <input type="number" step="0.01" placeholder="+ ou − valor..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                value={adj[card.id] || ''} onChange={e => setAdj(p => ({ ...p, [card.id]: e.target.value }))} />
              <button onClick={() => apply(card.id)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold">Aplicar</button>
            </div>
            <p className="text-slate-600 text-xs mt-1.5">Negativo para debitar saldo</p>
          </div>
        ))}
      </div>
      {open && (
        <Modal title="Novo Cartão de Benefício" onClose={() => setOpen(false)}>
          <Field label="Nome"><input className={inp} placeholder="Ex: VR Sodexo..." value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Tipo">
            <select className={inp} value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}>
              <option value="VR">VR – Vale Refeição</option>
              <option value="VA">VA – Vale Alimentação</option>
              <option value="VT">VT – Vale Transporte</option>
              <option value="Other">Outro</option>
            </select>
          </Field>
          <Field label="Saldo (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.balance} onChange={e => setF(p => ({ ...p, balance: e.target.value }))} /></Field>
          <OwnerToggle value={f.owner} onChange={v => setF(p => ({ ...p, owner: v }))} mode={mode} />
          <SaveBtn onClick={save} label="Salvar Cartão" />
        </Modal>
      )}
    </div>
  )
}

/* ── loans ───────────────────────────────────────────────────────────────── */
function LoansTab({ loans, setLoans, mode }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', totalAmount: '', interestRate: '', totalInstallments: '', remainingInstallments: '', monthlyPayment: '', owner: 'me' })
  const save = () => {
    if (!f.name.trim() || !f.totalAmount || !f.totalInstallments) return
    setLoans(p => [...p, { ...f, id: uid(), totalAmount: parseFloat(f.totalAmount), interestRate: parseFloat(f.interestRate || 0), totalInstallments: parseInt(f.totalInstallments), remainingInstallments: parseInt(f.remainingInstallments || f.totalInstallments), monthlyPayment: parseFloat(f.monthlyPayment || 0) }])
    setF({ name: '', totalAmount: '', interestRate: '', totalInstallments: '', remainingInstallments: '', monthlyPayment: '', owner: 'me' })
    setOpen(false)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-6">
          <div><p className="text-slate-400 text-xs">Parcelas/mês</p><p className="text-red-400 font-bold text-xl" style={mono}>{fmt(loans.reduce((a, b) => a + b.monthlyPayment, 0))}</p></div>
          <div><p className="text-slate-400 text-xs">Total restante</p><p className="text-white font-bold text-xl" style={mono}>{fmt(loans.reduce((a, b) => a + b.remainingInstallments * b.monthlyPayment, 0))}</p></div>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus size={16} /> Adicionar
        </button>
      </div>
      <div className="space-y-4">
        {loans.length === 0 && <p className="text-slate-500 text-center py-12 text-sm">Nenhum empréstimo cadastrado</p>}
        {loans.map(loan => {
          const paid    = loan.totalInstallments - loan.remainingInstallments
          const paidPct = (paid / loan.totalInstallments) * 100
          return (
            <div key={loan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold mb-1.5">{loan.name}</p>
                  <div className="flex gap-2">
                    <Badge color="red">{loan.interestRate}% a.m.</Badge>
                    {mode === 'couple' && <Badge color="blue">{loan.owner === 'me' ? 'Eu' : 'Parceiro(a)'}</Badge>}
                  </div>
                </div>
                <button onClick={() => setLoans(p => p.filter(l => l.id !== loan.id))} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['Total', fmt(loan.totalAmount), 'text-slate-300'], ['Parcela', fmt(loan.monthlyPayment), 'text-red-400'], ['Restante', fmt(loan.remainingInstallments * loan.monthlyPayment), 'text-amber-400']].map(([label, value, color]) => (
                  <div key={label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className={`font-bold text-sm ${color}`} style={mono}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{paid} de {loan.totalInstallments} pagas</span>
                  <span className="text-slate-500">{loan.remainingInstallments} restante(s)</span>
                </div>
                <Bar pct={paidPct} color="#10B981" />
              </div>
            </div>
          )
        })}
      </div>
      {open && (
        <Modal title="Novo Empréstimo / Dívida" onClose={() => setOpen(false)}>
          <Field label="Nome"><input className={inp} placeholder="Ex: Financiamento, Cartão..." value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor Total (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.totalAmount} onChange={e => setF(p => ({ ...p, totalAmount: e.target.value }))} /></Field>
            <Field label="Juros (% a.m.)"><input className={inp} type="number" step="0.01" min="0" placeholder="1.99" value={f.interestRate} onChange={e => setF(p => ({ ...p, interestRate: e.target.value }))} /></Field>
            <Field label="Total Parcelas"><input className={inp} type="number" min="1" placeholder="12" value={f.totalInstallments} onChange={e => setF(p => ({ ...p, totalInstallments: e.target.value }))} /></Field>
            <Field label="Parcelas Restantes"><input className={inp} type="number" min="0" placeholder="8" value={f.remainingInstallments} onChange={e => setF(p => ({ ...p, remainingInstallments: e.target.value }))} /></Field>
          </div>
          <Field label="Valor da Parcela (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.monthlyPayment} onChange={e => setF(p => ({ ...p, monthlyPayment: e.target.value }))} /></Field>
          <OwnerToggle value={f.owner} onChange={v => setF(p => ({ ...p, owner: v }))} mode={mode} />
          <SaveBtn onClick={save} label="Salvar Empréstimo" />
        </Modal>
      )}
    </div>
  )
}

/* ── goals ───────────────────────────────────────────────────────────────── */
function GoalsTab({ goals, setGoals }) {
  const [open, setOpen] = useState(false)
  const [dep, setDep]   = useState({})
  const [f, setF] = useState({ name: '', currentAmount: '', targetAmount: '', targetDate: '', color: GOAL_COLORS[0] })
  const save = () => {
    if (!f.name.trim() || !f.targetAmount) return
    setGoals(p => [...p, { ...f, id: uid(), currentAmount: parseFloat(f.currentAmount || 0), targetAmount: parseFloat(f.targetAmount) }])
    setF({ name: '', currentAmount: '', targetAmount: '', targetDate: '', color: GOAL_COLORS[0] })
    setOpen(false)
  }
  const deposit = id => {
    const v = parseFloat(dep[id] || 0)
    if (!v || v <= 0) return
    setGoals(p => p.map(g => g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, parseFloat((g.currentAmount + v).toFixed(2))) } : g))
    setDep(p => ({ ...p, [id]: '' }))
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-400 text-sm">{goals.length} meta(s) ativa(s)</p>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus size={16} /> Nova Meta
        </button>
      </div>
      <div className="space-y-4">
        {goals.length === 0 && <p className="text-slate-500 text-center py-12 text-sm">Nenhuma meta cadastrada</p>}
        {goals.map(goal => {
          const pct  = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
          const left = Math.max(0, goal.targetAmount - goal.currentAmount)
          const daysLeft = goal.targetDate ? Math.max(0, Math.ceil((new Date(goal.targetDate + 'T00:00:00') - new Date()) / 86400000)) : null
          return (
            <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: goal.color }} />
                  <p className="text-white font-semibold">{goal.name}</p>
                </div>
                <button onClick={() => setGoals(p => p.filter(g => g.id !== goal.id))} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={15} /></button>
              </div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-white" style={mono}>{fmt(goal.currentAmount)}</span>
                  <span className="text-slate-400 text-sm ml-2">de {fmt(goal.targetAmount)}</span>
                </div>
                <span className="text-2xl font-bold" style={{ ...mono, color: goal.color }}>{pct.toFixed(0)}%</span>
              </div>
              <Bar pct={pct} color={goal.color} />
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>Faltam <span className="text-slate-300 font-medium" style={mono}>{fmt(left)}</span></span>
                {daysLeft !== null && <span className="flex items-center gap-1"><Calendar size={10} />{daysLeft === 0 ? 'Meta hoje!' : `${daysLeft} dias restantes`}</span>}
              </div>
              {pct >= 100
                ? <div className="mt-4 bg-emerald-900/30 border border-emerald-800/50 rounded-xl py-2.5 text-center text-emerald-400 text-sm font-semibold">🎉 Meta alcançada!</div>
                : (
                  <div className="flex gap-2 mt-4">
                    <input type="number" step="0.01" min="0.01" placeholder="Depositar valor..."
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                      value={dep[goal.id] || ''} onChange={e => setDep(p => ({ ...p, [goal.id]: e.target.value }))} />
                    <button onClick={() => deposit(goal.id)}
                      className="text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                      style={{ backgroundColor: goal.color }}>Depositar</button>
                  </div>
                )}
            </div>
          )
        })}
      </div>
      {open && (
        <Modal title="Nova Meta de Economia" onClose={() => setOpen(false)}>
          <Field label="Nome da Meta"><input className={inp} placeholder="Ex: Viagem, Reserva..." value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Saldo Atual (R$)"><input className={inp} type="number" step="0.01" min="0" placeholder="0,00" value={f.currentAmount} onChange={e => setF(p => ({ ...p, currentAmount: e.target.value }))} /></Field>
            <Field label="Valor Alvo (R$)"><input className={inp} type="number" step="0.01" min="0.01" placeholder="0,00" value={f.targetAmount} onChange={e => setF(p => ({ ...p, targetAmount: e.target.value }))} /></Field>
          </div>
          <Field label="Data Alvo"><input className={inp} type="date" value={f.targetDate} onChange={e => setF(p => ({ ...p, targetDate: e.target.value }))} /></Field>
          <Field label="Cor">
            <div className="flex gap-3">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setF(p => ({ ...p, color: c }))}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: f.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px', transform: f.color === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </Field>
          <SaveBtn onClick={save} label="Criar Meta" />
        </Modal>
      )}
    </div>
  )
}

/* ── app root ────────────────────────────────────────────────────────────── */
export default function Page() {
  const [mode, setMode]         = useState('single')
  const [tab, setTab]           = useState('dashboard')
  const [incomes, setIncomes]   = useState(SEED.incomes)
  const [expenses, setExpenses] = useState(SEED.expenses)
  const [benefits, setBenefits] = useState(SEED.benefits)
  const [loans, setLoans]       = useState(SEED.loans)
  const [goals, setGoals]       = useState(SEED.goals)

  const myIncomes  = mode === 'single' ? incomes.filter(i => i.owner === 'me')  : incomes
  const myBenefits = mode === 'single' ? benefits.filter(b => b.owner === 'me') : benefits
  const myLoans    = mode === 'single' ? loans.filter(l => l.owner === 'me')    : loans

  const TABS = [
    { id: 'dashboard', label: 'Painel',     Icon: BarChart2  },
    { id: 'income',    label: 'Renda',      Icon: TrendingUp },
    { id: 'expenses',  label: 'Despesas',   Icon: Home       },
    { id: 'benefits',  label: 'Benefícios', Icon: CreditCard },
    { id: 'loans',     label: 'Dívidas',    Icon: Percent    },
    { id: 'goals',     label: 'Metas',      Icon: Target     },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">FinançasPro</h1>
              <p className="text-slate-500 text-xs mt-0.5">{mode === 'couple' ? '👫 Modo Casal' : '👤 Modo Individual'}</p>
            </div>
          </div>
          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1">
            {[{ v: 'single', l: 'Solteiro', I: User }, { v: 'couple', l: 'Casal', I: Users }].map(({ v, l, I }) => (
              <button key={v} type="button" onClick={() => setMode(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === v ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <I size={14} /> {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-[61px] z-30 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab === id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </nav>

      {/* content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        {tab === 'dashboard' && <Dashboard incomes={myIncomes} expenses={expenses} benefits={myBenefits} loans={myLoans} goals={goals} />}
        {tab === 'income'    && <IncomeTab   incomes={myIncomes}   setIncomes={setIncomes}   mode={mode} />}
        {tab === 'expenses'  && <ExpensesTab expenses={expenses}   setExpenses={setExpenses} mode={mode} />}
        {tab === 'benefits'  && <BenefitsTab benefits={myBenefits} setBenefits={setBenefits} mode={mode} />}
        {tab === 'loans'     && <LoansTab    loans={myLoans}       setLoans={setLoans}       mode={mode} />}
        {tab === 'goals'     && <GoalsTab    goals={goals}         setGoals={setGoals} />}
      </main>
    </div>
  )
}
