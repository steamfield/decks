/**
 * Slide 6: TEC §§39A.111-.112 and 19 TAC §97.1065, read 2026-11-06.
 * KUT 2026-09-18 confirms appeals filed; Austin Politics 2026-10-31 reports
 * petition validation and complaint review. See data-sources.md, Slide 6.
 */
// TEC §39A.111 specifies five legally consecutive unacceptable years and two remedies.
export const trigger = { years: 5, label: 'Consecutive unacceptable ratings', status: 'confirmed' } as const
// Appeal outcome remains open as of the research cutoff; this gate is conditional.
export const appealGate = { label: 'If the ratings survive appeal', status: 'pending' } as const
// TEC §39A.111(1)-(2); either remedy satisfies this campus-trigger provision.
export const remedies = [
  { label: 'State-appointed board replaces elected trustees', scope: 'District', status: 'confirmed' },
  { label: 'Close the campus', scope: 'Campus', status: 'confirmed' },
] as const
// TEC §39A.112(a)-(b), TAC §97.1065(d): majority of enrolled students, not majority of signatures collected.
export const petition = {
  label: 'Parent petition', thresholdPercent: 50, comparator: 'greater than', signaturesPerStudent: 1,
  enrollmentSnapshot: '2026-10-30', snapshotBasis: 'Austin Politics reporting',
  ruleStatus: 'confirmed', status: 'pending', complaintStatus: 'pending',
  decisionMaker: 'Superintendent validates; commissioner determines action',
} as const
// TEC §39A.112(c): written explanation and alternative authorized action; commissioner may accept.
export const trusteeRequest = { label: 'Trustee request', decisionMaker: 'AISD trustees; commissioner may grant request', status: 'pending', ruleStatus: 'confirmed' } as const
// TAC §97.1065(c) permits supplementary oversight; §39A.111 still requires one of its two remedies.
export const supplementaryOversight = { label: 'Monitor or conservator alone does not satisfy the rule', status: 'confirmed' } as const

// Plain-language labels for the same sourced rule and conditional outcomes.
export const triggerDisplay = {
  countWord: 'five', remedyCountWord: 'two', gate: 'If the appeals fail', pending: 'Pending',
  appealsPending: 'Appeals pending', validationPending: 'Validation pending',
  board: 'State-appointed board', boardEffect: 'Replaces elected trustees', closure: 'Close the campus',
  supplement: 'Monitor or conservator', supplementLimit: 'Can be added to the required action',
  source: 'Source: Texas school intervention law',
  sourceUrl: 'https://tcss.legis.texas.gov/resources/ED/htm/ED.39A.htm',
} as const
