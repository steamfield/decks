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

// Display labels condensed from source-outline.md, Slide 23. All remain scenarios.
export const futureRows = [
  ['New commissioner confirmed', 'Appointment unresolved', 'Appointment disputed'],
  ['Elected board retains authority', 'Intervention proceeds', 'Elected board replaced'],
  ['Additional state funding', 'Some additional funding', 'School budget cuts'],
  ['Families participate', 'Families differ on intervention', 'Families dispute decisions'],
] as const
export const futureDisplay = {
  scenario: 'Scenario',
  source: 'Source: school intervention law · scenarios are author judgment',
  sourceUrl: 'https://tcss.legis.texas.gov/resources/ED/htm/ED.39A.htm',
} as const
