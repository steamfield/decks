/**
 * Slide 11: Senate news 2025-05-23; HB 2 enrolled certification; AISD budget
 * process table and 2026-06-23 budget update. Opened 2026-11-06.
 * Amounts are dollars, never millions. See data-sources.md, Slide 11.
 */
// Senate official account: $8.5 billion in new public-school funding in HB 2 (2025).
export const hb2 = { bill: 'HB 2', year: 2025, additionalFunding: 8500000000, period: '2026–27 state fiscal biennium', status: 'confirmed' } as const
// Enrolled act certification: Senate passage with amendments, May 23, 2025, 31 yeas / 0 nays.
export const hb2SenateVote = { date: '2025-05-23', yes: 31, no: 0, unanimous: true, status: 'confirmed' } as const
// AISD June 23 update: $181M gap before reductions, $887M operating budget, $205M identified reductions.
export const aisdBudget = { schoolYear: '2026-2027', preReductionGap: 181000000, adoptedOperatingBudget: 887000000, identifiedReductions: 205000000, reportDate: '2026-06-23', status: 'confirmed', currentForecastStatus: 'pending' } as const
// AISD budget/process, FY2026 adopted column: $715,523,373; rounded prose $715.5M.
export const recapture = {
  schoolYear: '2025-2026', dollars: 715523373, displayMillions: 715.5,
  basis: 'Adopted-budget estimate', status: 'confirmed', actualPaymentStatus: 'pending',
  definition: 'Local property-tax revenue above the state formula entitlement sent back into the statewide school-funding system',
} as const
