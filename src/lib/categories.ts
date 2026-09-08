export const BENEFIT_TYPES = {
  VR: 'Vale Refeição',
  VA: 'Vale Alimentação',
  VT: 'Vale Transporte',
  Other: 'Outro',
} as const

export type BenefitType = keyof typeof BENEFIT_TYPES

export const GOAL_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']
