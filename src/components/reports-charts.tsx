'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
        <Bar dataKey="renda" name="Renda" fill="var(--accent-emerald)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill="var(--accent-red)" radius={[6, 6, 0, 0]} />
      </BarChart>
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
