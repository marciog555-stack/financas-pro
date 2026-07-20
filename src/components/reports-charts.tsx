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

const PIE_COLORS = [
  'var(--accent-emerald)',
  'var(--accent-blue)',
  'var(--accent-purple)',
  'var(--accent-orange)',
  'var(--accent-red)',
  '#14B8A6',
  '#6366F1',
  '#F97316',
  '#84CC16',
  '#EC4899',
]

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

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-foreground/40">Sem despesas para exibir.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
  )
}
