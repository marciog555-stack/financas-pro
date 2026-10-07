'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { fmtCurrency } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'

export function MonthlyBarChart({
  data,
}: {
  data: { month: string; renda: number; despesas: number }[]
}) {
  const lastIndex = data.length - 1
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
        <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} width={80} tickFormatter={(v) => fmtCurrency(v)} />
        <Tooltip
          formatter={(value) => fmtCurrency(Number(value))}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            fontSize: 13,
            background: 'var(--background)',
          }}
        />
        <Legend />
        <Bar dataKey="renda" name="Renda" fill="var(--accent-emerald)" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="var(--accent-emerald)" fillOpacity={i === lastIndex ? 1 : 0.55} />
          ))}
        </Bar>
        <Bar dataKey="despesas" name="Despesas" fill="var(--accent-purple)" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="var(--accent-purple)" fillOpacity={i === lastIndex ? 1 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CashFlowChart({
  data,
}: {
  data: { day: number; entradas: number; saidas: number }[]
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-foreground/40">Sem movimentação neste mês ainda.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="cashFlowEntradas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cashFlowSaidas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10 }}
          stroke="currentColor"
          opacity={0.4}
          tickFormatter={(v) => `${v}`}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          formatter={(value) => fmtCurrency(Number(value))}
          labelFormatter={(label) => `Dia ${label}`}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            fontSize: 13,
            background: 'var(--background)',
          }}
        />
        <Area
          type="monotone"
          dataKey="saidas"
          name="Saídas"
          stroke="var(--accent-purple)"
          strokeWidth={2}
          fill="url(#cashFlowSaidas)"
        />
        <Area
          type="monotone"
          dataKey="entradas"
          name="Entradas"
          stroke="var(--accent-emerald)"
          strokeWidth={2.5}
          fill="url(#cashFlowEntradas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({
  data,
  total,
  size = 'default',
}: {
  data: { name: string; value: number }[]
  total: number
  size?: 'default' | 'compact'
}) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-foreground/40">Sem despesas para exibir.</p>
  }
  const compact = size === 'compact'
  const height = compact ? 128 : 240
  const innerRadius = compact ? 32 : 64
  const outerRadius = compact ? 50 : 92
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => fmtCurrency(Number(value))}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--border-color)',
              fontSize: 13,
              background: 'var(--background)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        {!compact && <span className="text-[11px] text-foreground/45">Total</span>}
        <span
          className={
            compact
              ? 'font-mono text-[10px] font-semibold leading-tight'
              : 'font-mono text-lg font-semibold'
          }
        >
          {fmtCurrency(total)}
        </span>
      </div>
    </div>
  )
}
