/**
 * OpenData MCP snapshots queried 2026-10-15; exact SQL is in the JSON fixtures.
 * TEA accountability enrollment / AISD permanent capacity, held constant in
 * 2017–18 and 2025–26. Estimates, not historical measured building utilization.
 * 2025–26 is the latest available year at query time. See data-sources.md.
 */
import capacitySnapshot from './campus-capacity-snapshot.json'
import enrollmentSnapshot from './campus-enrollment-snapshot.json'

const capacities = new Map(capacitySnapshot.rows.map(row => [row.campus_id, row]))
const enrollments = new Map(enrollmentSnapshot.rows.map(row => [row.campus_number, row]))

export function campusUtilization(campusNumber: string) {
  const enrollment = enrollments.get(campusNumber)
  const facility = capacities.get(Number(campusNumber.slice(-3)))
  // The source combines Blazier facilities; neither individual TEA campus
  // can use this denominator without a verified historical facility crosswalk.
  const combined = campusNumber === '227901185' || campusNumber === '227901196'
  const capacity = !combined && facility?.capacity && facility.capacity > 0 ? facility.capacity : null
  const start = enrollment?.enrollment2018 ?? null
  const end = enrollment?.enrollment2026 ?? null
  return {
    capacity,
    start,
    end,
    utilizationStart: capacity && start !== null ? start / capacity * 100 : null,
    utilizationEnd: capacity && end !== null ? end / capacity * 100 : null,
    change: capacity && start !== null && end !== null ? (end - start) / capacity * 100 : null,
    enrollmentChange: start !== null && end !== null ? end - start : null,
    note: combined ? 'Combined Blazier capacity; campus estimate unavailable.' : !capacity ? 'Permanent capacity unavailable.' : start === null ? '2017–18 enrollment unavailable.' : null,
  }
}
