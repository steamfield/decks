/**
 * Slide 10: waffle of the 102 AISD campuses that are open in 2026-27 and carry
 * a 2025-26 TEA rating.
 *
 * Ratings come from `tea/accountability-summary` (TEA's 2026 statewide
 * multi-year ratings file), district 227901, campus rows only. Recomputed
 * 2026-10-03; SQL and method in data-sources.md, "Refresh 2026-10-03".
 *
 * Basis: TEA rated 114 AISD campuses in 2025-26 (8 more are Not Rated). Twelve
 * of them closed for 2026-27 (Austin Current, 2026-09-21): the six whose
 * records TEA moved to a receiving campus (Barrington, Dawson, Martin, Oak
 * Springs, Paredes, Widen, all F) and six whose campus numbers were retired
 * (Becker A, Bedichek C, International HS B, Ridgetop A, Sunset Valley A, Winn
 * C). One square per open campus, so a closed school's record is drawn once,
 * on the campus now carrying it, rather than twice.
 *
 * - `chronic` 2: Burnet and Webb, the two that crossed the fifth consecutive F.
 * - `atFour` 9: the campuses now carrying four consecutive unacceptable
 *   ratings into 2026-27. Three on their own records (Dobie D 62, Linder F,
 *   Pecan Springs F); six on a closed school's record, with their own
 *   2025-26 rating in brackets: Bailey MS from Paredes (B), Guerrero Thompson
 *   EL from Barrington (B), Galindo EL from Dawson (B), Kealing MS from Martin
 *   (A), Blackshear EL from Oak Springs (C), Rodriguez EL from Widen (B).
 *   FLAG: derived count for the three own-record campuses (TEA publishes no
 *   consecutive-count column); the six transfers are TEA's assignment as
 *   reported by the Austin Current.
 * - `dfOther` 20: the other open campuses rated D or F in 2025-26. Open D/F
 *   total is 25 (31 district-wide less the six closed F campuses).
 * - `other` 71: open campuses rated C or better, less the six receivers
 *   (83 C-or-better, less 6 closed, less 6 receivers).
 *
 * Earlier vintages: 2 / 9 / 20 / 83 over all 114 rated campuses (2026-09-26),
 * which drew the six closed campuses as the nine and left the receivers in
 * C or better; 3 / 31 / 81 before that, a 2024-25 blog figure TEA's ratings
 * do not support.
 */
import { campuses } from './campuses'

export const waffleCounts = {
  chronic: 2,
  atFour: 9,
  dfOther: 20,
  other: 71,
}

/** Open campuses rated D or F in 2025-26 (chronic + own-record D/F at four + dfOther). */
export const waffleOpenDf = 25
/** Of those 25, D or F in each of 2023-24, 2024-25 and 2025-26. */
export const waffleOpenDfThreeYears = 20

const priorityIds = [
  '227901046', '227901053', '227901055', '227901160', '227901129',
  '227901059', '227901186', '227901176', '227901044', '227901105', '227901174',
]
export type WaffleTier = 'chronic' | 'atFour' | 'dfOther' | 'other'
export const waffleCampuses = campuses
  .filter(campus => !campus.closed)
  .map(campus => {
    const tier: WaffleTier = campus.consecutiveFs >= 5 ? 'chronic'
      : campus.consecutiveFs === 4 ? 'atFour'
      : ['D', 'F'].includes(campus.rating) ? 'dfOther' : 'other'
    return { ...campus, tier }
  })
  .sort((a, b) => {
    const tiers = ['chronic', 'atFour', 'dfOther', 'other']
    return tiers.indexOf(a.tier) - tiers.indexOf(b.tier)
      || (priorityIds.indexOf(a.campusNumber) - priorityIds.indexOf(b.campusNumber))
      || a.campus.localeCompare(b.campus)
  })

/** Inherited histories stay visibly separate from a receiver's own grade. */
export function waffleBaseGroup(campus: (typeof waffleCampuses)[number]) {
  return campus.tier === 'chronic' ? 'chronic'
    : campus.inheritedFrom ? 'inherited'
    : ['D', 'F'].includes(campus.rating) ? 'dfOther' : 'other'
}

/** Match the visible legend: rating groups first, inherited-count tiers last. */
export function waffleDisplayCampuses(showInheritedCounts: boolean) {
  if (showInheritedCounts) return waffleCampuses
  const groups = ['chronic', 'dfOther', 'inherited', 'other']
  return [...waffleCampuses].sort((a, b) =>
    groups.indexOf(waffleBaseGroup(a)) - groups.indexOf(waffleBaseGroup(b)),
  )
}
