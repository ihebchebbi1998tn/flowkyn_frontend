export const INDUSTRY_OPTIONS = [
  { value: 'techSaaS', icon: '💻' },
  { value: 'finance', icon: '💰' },
  { value: 'healthcare', icon: '🏥' },
  { value: 'retail', icon: '🛒' },
  { value: 'manufacturing', icon: '🏭' },
  { value: 'education', icon: '📚' },
] as const;

export const CRISIS_OPTIONS = [
  { value: 'marketDisruption' },
  { value: 'productLaunchCrisis' },
  { value: 'budgetCuts' },
  { value: 'teamConflict' },
] as const;

export const DIFFICULTY_OPTIONS: Array<{ value: 'easy' | 'medium' | 'hard'; icon: string }> = [
  { value: 'easy', icon: '😊' },
  { value: 'medium', icon: '🎯' },
  { value: 'hard', icon: '🔥' },
];
