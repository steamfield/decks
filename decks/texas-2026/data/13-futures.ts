/**
 * Slide 12: three paths for Austin ISD, built from sourced facts plus the
 * author's judgment about which is most likely. Checked 2026-11-06.
 *
 * Facts: the Burnet and Webb parent petitions ask for campus closure, and
 * initial counts exceeded the required majority (Austin Politics, citing the
 * superintendent's Oct 19 letter); a valid timely petition generally requires
 * its requested action (TEC §39A.112(b)); TEA is reviewing a Webb PTA
 * signature complaint (Oct 26). A new commissioner may replace board-of-
 * managers members (TEC §39A.207). Hinojosa pledged to end state takeovers
 * (Texas Tribune, Nov 4). Houston ISD has been under a state board since
 * June 1, 2023, extended through June 1, 2027 (TEA). See data-sources.md,
 * Slide 12.
 */
// Petition record behind the "most likely" column.
export const petitions = {
  remedy: 'campus closure', campuses: ['Burnet', 'Webb'],
  initialCounts: 'exceeded the required majority', countsReported: '2026-10-19',
  complaint: 'Webb PTA signature complaint under TEA review', complaintReported: '2026-10-26',
  validationDeadline: '2026-12-01', status: 'pending',
} as const
// TEA: Houston ISD board of managers installed June 1, 2023; extended through June 1, 2027.
export const houston = { installed: '2023-06-01', extendedThrough: '2027-06-01', status: 'confirmed' } as const

// FLAG: author judgment. Column 0 is the author's "most likely"; no probability is estimated.
export const futureColumns = [
  { label: 'Petitions hold', tag: 'Most likely', kind: 'scenario', status: 'flag', basis: 'author judgment from the petition record' },
  { label: 'New commissioner', tag: 'Scenario', kind: 'scenario', status: 'flag', basis: 'author judgment; §39A.207 and Hinojosa pledge' },
  { label: 'Houston-style', tag: 'Scenario', kind: 'scenario', status: 'flag', basis: 'author judgment; Houston record' },
] as const
export const futureDimensions = ['Board', 'Who leads', 'State aim'] as const

// Display labels; every cell is a scenario, not an observed outcome.
export const futureRows = [
  ['Elected board stays', 'Replaced for now', 'Replaced for years'],
  ['Elected trustees', 'Managers a new commissioner picks', 'Managers named under Morath'],
  ['Close Burnet and Webb', 'Help the district recover', 'Overhaul from the top'],
] as const
export const futureDisplay = {
  scenario: 'Scenario',
  source: 'Sources: school intervention law · petition and takeover reporting',
  sourceUrl: 'https://tcss.legis.texas.gov/resources/ED/htm/ED.39A.htm',
} as const
