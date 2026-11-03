/**
 * Slide 12: Spring 2025 vs Spring 2026 STAAR pass-rate scatter, 24 AISD
 * campuses with three straight D/F ratings, 2022-23 to 2024-25.
 *
 * STAAR pass rate = approaches_plus_count / tests_taken, English only,
 * Science excluded, `tea/staar-cambium-campus` (same query as the blog
 * article's "More than three schools are struggling" scatter, restricted here
 * to the subset selected for the slide). The original 21 points were verified
 * 2026-06-17; Barrington, Oak Springs and Paredes were added 2026-09-26 so all
 * nine campuses one F from the trigger appear, and six existing points were
 * re-queried then and matched to the decimal (SQL in data-sources.md,
 * "Refresh 2026-09-26").
 *
 * `tier` (updated 2026-09-26): Burnet and Webb crossed the fifth F in TEA's
 * preliminary 2025-26 ratings. The nine one F from the trigger include Dobie,
 * whose 2025-26 D paused its count at four. Everything else is "Other D/F
 * campus", including Wooldridge (B in 2025-26) and Winn (C), whose runs reset.
 * FLAG: derived count (see `data/03-countdown.ts`).
 *
 * Relabeled 2026-10-03: six of the nine amber points are campuses AISD closed
 * for 2026-27. TEA moved each one's record to the campus that took its
 * students (Austin Current, 2026-09-21), so the point keeps its own STAAR
 * coordinates and its amber tier (the record is still one F from the
 * trigger) and its tooltip name says where the record now sits. The
 * receiving campuses are not plotted: none has three straight D/F years.
 */
import { getCampus } from './campuses'

const points = [
  { campusNumber: '227901055', campus: 'Dobie MS', x: 29.3, y: 34.9, tier: 'One F from the trigger' },
  { campusNumber: '227901053', campus: 'Webb MS', x: 29.3, y: 32.4, tier: 'Crossed the fifth F' },
  { campusNumber: '227901046', campus: 'Burnet MS', x: 34.9, y: 37.3, tier: 'Crossed the fifth F' },
  { campusNumber: '227901051', campus: 'Martin MS (closed; record moved to Kealing MS)', x: 25.8, y: 28.8, tier: 'One F from the trigger' },
  { campusNumber: '227901152', campus: 'Wooldridge EL', x: 40.9, y: 56.9, tier: 'Other D/F campus' },
  { campusNumber: '227901114', campus: 'Dawson EL (closed; record moved to Galindo EL)', x: 32.4, y: 40.5, tier: 'One F from the trigger' },
  { campusNumber: '227901129', campus: 'Pecan Springs EL', x: 40.3, y: 34.7, tier: 'One F from the trigger' },
  { campusNumber: '227901175', campus: 'Widen EL (closed; record moved to Rodriguez EL)', x: 35.9, y: 47.7, tier: 'One F from the trigger' },
  { campusNumber: '227901157', campus: 'Winn Montessori', x: 61.5, y: 69.8, tier: 'Other D/F campus' },
  { campusNumber: '227901160', campus: 'Linder EL', x: 38.6, y: 41.1, tier: 'One F from the trigger' },
  { campusNumber: '227901149', campus: 'Barrington EL (closed; record moved to Guerrero Thompson EL)', x: 47.9, y: 50.4, tier: 'One F from the trigger' },
  { campusNumber: '227901125', campus: 'Oak Springs EL (closed; record moved to Blackshear EL)', x: 36.3, y: 35.2, tier: 'One F from the trigger' },
  { campusNumber: '227901061', campus: 'Paredes MS (closed; record moved to Bailey MS)', x: 42.0, y: 42.1, tier: 'One F from the trigger' },
  { campusNumber: '227901065', campus: 'Sadler Means YWLA', x: 41.9, y: 58.8, tier: 'Other D/F campus' },
  { campusNumber: '227901109', campus: 'Brown EL', x: 43.4, y: 57.1, tier: 'Other D/F campus' },
  { campusNumber: '227901178', campus: 'Jordan EL', x: 29.9, y: 30.4, tier: 'Other D/F campus' },
  { campusNumber: '227901164', campus: 'Pickle EL', x: 54.4, y: 45.5, tier: 'Other D/F campus' },
  { campusNumber: '227901116', campus: 'Govalle EL', x: 42.9, y: 37.5, tier: 'Other D/F campus' },
  { campusNumber: '227901150', campus: 'Norman-Sims EL', x: 41.0, y: 45.7, tier: 'Other D/F campus' },
  { campusNumber: '227901101', campus: 'Allison EL', x: 50.0, y: 40.7, tier: 'Other D/F campus' },
  { campusNumber: '227901118', campus: 'Harris EL', x: 52.3, y: 47.9, tier: 'Other D/F campus' },
  { campusNumber: '227901141', campus: 'Walnut Creek EL', x: 55.3, y: 63.9, tier: 'Other D/F campus' },
  { campusNumber: '227901147', campus: 'Menchaca EL', x: 67.2, y: 67.2, tier: 'Other D/F campus' },
  { campusNumber: '227901161', campus: 'Cook EL', x: 50.2, y: 51.8, tier: 'Other D/F campus' },
]

/**
 * Hover metadata: TEA 2025–26 accountability snapshot shared with slide 10.
 * Join by campus number, retaining closed campuses' own grades/demographics.
 * Enrollment is the same 2025–26 vintage as the latest accountability grade.
 * Source/workbook verification: data-sources.md, slide 7 and slide 9.
 */
export const scatterPoints = points.map(point => {
  const metadata = getCampus(point.campusNumber)
  return {
    ...point,
    metadata,
    consecutiveFs: metadata.ownConsecutiveFs,
    closed: metadata.closed,
    recordMovedTo: metadata.recordMovedTo,
    change: Math.round((point.y - point.x) * 10) / 10,
  }
})
