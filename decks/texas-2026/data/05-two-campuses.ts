/**
 * Slide 5: TEA accountability-summary, district 227901, fetched 2026-11-06.
 * Ported from examples/aisd-showcase/data/07-waffle.ts and its campus snapshot;
 * see examples/aisd-showcase/data-sources.md and this deck's Slide 5 ledger.
 * All 114 snapshot records and histories were rechecked against 1,123 TEA rows.
 * Garcia YMLA's 2026 score is corrected from 86 to 85. Current ratings await final publication.
 * Closures/transfers retain Austin Current's 2026-09-21 reporting. The legal
 * application of inherited counts, including the receiving-campus exception,
 * remains FLAG pending the TEA assignment letters. Counts are not TEA orders.
 */
import snapshot from './05-waffle-campuses.json'

export interface RatingYear { readonly year: number; readonly rating: string }
export interface CampusRecord {
  readonly campusNumber: string
  readonly campus: string
  readonly year: number
  readonly rating: string
  readonly score: number
  readonly ecoDis: number
  readonly enrollment: number
  readonly history: readonly RatingYear[]
}

// TEA 2026 multi-year workbook via the Slide 5 SQL; ecoDis is a proportion, not a percentage.
export const campusSnapshot: readonly CampusRecord[] = snapshot
export const accountabilitySource = 'https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-statewide-multi-year-ratings-spreadsheet.xlsx'
export const campusSnapshotStatus = { status: 'confirmed', finalRatings: 'pending', fetched: '2026-11-06' } as const

// Austin Current 2026-09-21, cross-checked with AISD consolidation list; see the ledger's closure qualification.
export const closedCampusIds = [
  '227901149', '227901114', '227901051', '227901125', '227901061', '227901175',
  '227901104', '227901054', '227901029', '227901133', '227901158', '227901157',
] as const
// Reported receiving campus -> closed campus; this is separate from each receiver's own grade.
export const campusTransfers: Readonly<Record<string, string>> = {
  '227901059': '227901061', '227901186': '227901149', '227901176': '227901114',
  '227901044': '227901051', '227901105': '227901125', '227901174': '227901175',
}
export const inheritedCountStatus = {
  status: 'flag', basis: 'Named reporting; primary assignment letters not verified',
  needed: 'TEA assignment letters and application of receiving-campus exceptions',
} as const

// Ported count method: F/Improvement Required increment; D/Not Rated pause; acceptable grades reset.
// FLAG: derived consecutive counts outside Burnet/Webb need TEA's final published year counts.
function countConsecutiveFs(history: readonly RatingYear[]): number {
  let count = 0
  for (const { rating } of [...history].sort((a, b) => a.year - b.year)) {
    if (rating === 'F' || rating === 'Improvement Required') count++
    else if (['A', 'B', 'C', 'Met Standard', 'Met Alternative Standard'].includes(rating)) count = 0
    else if (rating !== 'D' && rating !== 'Not Rated' && !rating.startsWith('Not Rated:')) {
      throw new Error(`Unknown accountability rating: ${rating}`)
    }
  }
  return count
}

const recordsById = new Map(campusSnapshot.map(campus => [campus.campusNumber, campus]))
function requireRecord(id: string): CampusRecord {
  const record = recordsById.get(id)
  if (!record) throw new Error(`Missing AISD campus: ${id}`)
  return record
}
const closedIds: ReadonlySet<string> = new Set(closedCampusIds)
export type WaffleTier = 'chronic' | 'atFour' | 'dfOther' | 'other'

// Derived from the preserved snapshot, closure list and reported transfers; 102 open, rated campuses.
export const waffleCampuses = campusSnapshot.filter(campus => !closedIds.has(campus.campusNumber)).map(campus => {
  const inheritedId = campusTransfers[campus.campusNumber]
  const inheritedFrom = inheritedId ? requireRecord(inheritedId) : undefined
  const ownConsecutiveFs = countConsecutiveFs(campus.history)
  const consecutiveFs = inheritedFrom ? countConsecutiveFs(inheritedFrom.history) : ownConsecutiveFs
  const tier: WaffleTier = consecutiveFs >= 5 ? 'chronic' : consecutiveFs === 4 ? 'atFour'
    : ['D', 'F'].includes(campus.rating) ? 'dfOther' : 'other'
  return { ...campus, ownConsecutiveFs, consecutiveFs, inheritedFrom, tier,
    countStatus: consecutiveFs >= 5 ? 'pending' as const : 'flag' as const }
})

// Slide 5 SQL and preserved closure list: 114 A-F + 8 not rated; 12 rated campuses closed.
export const waffleUniverse = { rated: 114, notRated: 8, rows: 122, closedRated: 12, visible: waffleCampuses.length, status: 'confirmed', basis: 'Open campuses with a 2025-26 A-F rating; not all district programs' } as const
// Derived groups: inherited histories affect atFour/other; their legal significance remains FLAG.
export const waffleCounts = { chronic: 2, atFour: 9, dfOther: 20, other: 71 } as const
export const waffleCountStatus = { chronic: 'pending', atFour: 'flag', dfOther: 'confirmed', other: 'flag' } as const
// TEA own grades, excluding the 12 closed records; unaffected by inherited-count interpretation.
export const waffleOpenDf = 25
// Same 25 campus IDs restricted to D/F in each of 2023-24, 2024-25 and 2025-26.
export const waffleOpenDfThreeYears = 20

// TEA campus query, KUT 2026-09-18 and AISD 2026-09-14: both appeals remain unresolved.
export const triggeringCampuses = [
  { campusNumber: '227901046', name: 'Burnet Middle School', rating: 'F', score: 59, countedRatings: ['F', 'F', 'F', 'F', 'F'], countedYears: [2019, 2023, 2024, 2025, 2026], scores: [54, 55, 57, 54, 59], status: 'confirmed', appeal: 'pending', finalCount: 'pending' },
  { campusNumber: '227901053', name: 'Webb Middle School', rating: 'F', score: 58, countedRatings: ['F', 'F', 'F', 'F', 'F'], countedYears: [2019, 2023, 2024, 2025, 2026], scores: [52, 59, 54, 59, 58], status: 'confirmed', appeal: 'pending', finalCount: 'pending' },
] as const
export const campusLabels = { district: 'Austin ISD', board: 'Elected school board', ratingQualification: 'Five counted F ratings; intervening Not Rated years pause the count' } as const
