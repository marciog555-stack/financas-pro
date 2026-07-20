export const EXPENSE_CATEGORIES = {
  rent: { label: 'Aluguel', emoji: '🏠' },
  water: { label: 'Água', emoji: '💧' },
  electricity: { label: 'Energia', emoji: '⚡' },
  internet: { label: 'Internet', emoji: '📡' },
  phone: { label: 'Celular', emoji: '📱' },
  market: { label: 'Mercado', emoji: '🛒' },
  transport: { label: 'Transporte', emoji: '🚗' },
  health: { label: 'Saúde', emoji: '💊' },
  leisure: { label: 'Lazer', emoji: '🎉' },
  other: { label: 'Outros', emoji: '📦' },
} as const

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES

export const BENEFIT_TYPES = {
  VR: 'Vale Refeição',
  VA: 'Vale Alimentação',
  VT: 'Vale Transporte',
  Other: 'Outro',
} as const

export type BenefitType = keyof typeof BENEFIT_TYPES

export const GOAL_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']
