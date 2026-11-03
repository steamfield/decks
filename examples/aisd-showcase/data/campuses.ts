/**
 * Shared AISD campus records for the waffle and scatter hover cards.
 * Source: TEA's public 2026 statewide multi-year workbook, fetched 2026-10-13.
 * Snapshot: 2026 State Summary demographics/ratings; 2018–2026 histories.
 * Closure/transfer assignments: data-sources.md, Refresh 2026-10-03.
 * Extraction and verification: data-sources.md, slide 7 hover-card snapshot.
 * Keep receiver demographics separate from the closed campus's F history.
 */
import snapshot from './07-waffle-campuses.json'

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

export const accountabilitySourceUrl = 'https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-accountability-rating-system'
export const closedCampusIds = [
  '227901149', '227901114', '227901051', '227901125', '227901061', '227901175',
  '227901104', '227901054', '227901029', '227901133', '227901158', '227901157',
]
/** Receiving campus -> closed campus, from the October 3 provenance table. */
export const campusTransfers: Readonly<Record<string, string>> = {
  '227901059': '227901061', '227901186': '227901149', '227901176': '227901114',
  '227901044': '227901051', '227901105': '227901125', '227901174': '227901175',
}
export interface RatingYear { readonly year: number; readonly rating: string }

/** Derived accountability count, not a TEA-published consecutive-count field.
 * D and Not Rated pause; A/B/C or a met-standard rating reset. */
export function countConsecutiveFs(history: readonly RatingYear[]): number {
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

const records: readonly CampusRecord[] = snapshot
const recordsById = new Map(records.map(campus => [campus.campusNumber, campus]))
if (recordsById.size !== records.length) throw new Error('Duplicate AISD campus number in snapshot')

function requireRecord(campusNumber: string): CampusRecord {
  const record = recordsById.get(campusNumber)
  if (!record) throw new Error(`Missing AISD campus metadata: ${campusNumber}`)
  return record
}

const closedIds = new Set(closedCampusIds)
const receiverByClosedId = new Map<string, CampusRecord>()
for (const closedId of closedIds) requireRecord(closedId)
for (const [receiverId, closedId] of Object.entries(campusTransfers)) {
  const receiver = requireRecord(receiverId)
  requireRecord(closedId)
  if (!closedIds.has(closedId) || closedIds.has(receiverId) || receiverByClosedId.has(closedId)) {
    throw new Error(`Invalid AISD campus record transfer: ${closedId} -> ${receiverId}`)
  }
  receiverByClosedId.set(closedId, receiver)
}

export const campuses = records.map(campus => {
  const inheritedId = campusTransfers[campus.campusNumber]
  const inheritedFrom = inheritedId ? requireRecord(inheritedId) : undefined
  const ownConsecutiveFs = countConsecutiveFs(campus.history)
  return {
    ...campus,
    ownConsecutiveFs,
    consecutiveFs: inheritedFrom ? countConsecutiveFs(inheritedFrom.history) : ownConsecutiveFs,
    inheritedFrom,
    closed: closedIds.has(campus.campusNumber),
    recordMovedTo: receiverByClosedId.get(campus.campusNumber)?.campus,
  }
})
export type Campus = (typeof campuses)[number]
const campusesById = new Map(campuses.map(campus => [campus.campusNumber, campus]))

/** Required joins fail loudly rather than dropping a dot or its history. */
export function getCampus(campusNumber: string): Campus {
  const campus = campusesById.get(campusNumber)
  if (!campus) throw new Error(`Missing AISD campus metadata: ${campusNumber}`)
  return campus
}
