/**
 * Slide 13: author-supplied conditional scenarios in source-outline.md, Slide 23.
 * Legal constraints are verified in Slides 6, 8-10. Checked 2026-11-06.
 * No probability estimate supports the middle column's relative likelihood.
 */
// FLAG: author-reported scenario framing; these are labels, not observed outcomes.
export const futureColumns = [
  { label: 'Best', kind: 'scenario', status: 'flag', basis: 'author-reported' },
  { label: 'Most likely', kind: 'scenario', status: 'flag', basis: 'author judgment; no probabilities estimated' },
  { label: 'Worst', kind: 'scenario', status: 'flag', basis: 'author-reported' },
] as const
// Author's selected dimensions; no quantitative forecast is encoded.
export const futureDimensions = ['Leadership', 'Intervention', 'Finances', 'Trust'] as const
