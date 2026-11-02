/**
 * Slide 5: mean tidal range at five NOAA stations.
 *
 * `MN` (Mean Range of Tide: mean high water minus mean low water) from the
 * NOAA CO-OPS metadata API, `.../stations/<id>/datums.json?units=metric`,
 * read 2026-11-02. Every station reports the 1983-2001 National Tidal Datum
 * Epoch. Request URLs are listed in data-sources.md under "Slide 5".
 */
import type { InkBarRow } from 'slidev-addon-decks/story'

export const EPOCH_LABEL = '1983 to 2001'

/** Meters. Station ids: 9455920, 8410140, 8443970, 9414290, 8729840. */
export const STATIONS = [
  { id: 'anchorage', label: 'Anchorage, AK', mn: 7.982 },
  { id: 'eastport', label: 'Eastport, ME', mn: 5.593 },
  { id: 'boston', label: 'Boston, MA', mn: 2.893 },
  { id: 'sf', label: 'San Francisco, CA', mn: 1.248 },
  { id: 'pensacola', label: 'Pensacola, FL', mn: 0.365 },
]

export const RANGE_ROWS: InkBarRow[] = STATIONS.map((s) => ({
  id: s.id,
  label: s.label,
  value: s.mn,
  text: `${s.mn.toFixed(1)} m`,
}))

const byId = (id: string) => STATIONS.find((s) => s.id === id)!.mn
export const ANCHORAGE_LABEL = `${byId('anchorage').toFixed(1)} m`
export const EASTPORT_LABEL = `${byId('eastport').toFixed(1)} m`
/**
 * 0.365 m to two places. `toFixed(2)` rounds the binary double just under
 * 0.365 down to "0.36"; rounding the centimeters gives the half-up 0.37.
 */
export const PENSACOLA_LABEL = `${(Math.round(byId('pensacola') * 100) / 100).toFixed(2)} m`
/** Anchorage's mean range over Pensacola's: 7.982 / 0.365 = 21.9, so "22". */
export const ANCHORAGE_OVER_PENSACOLA = String(Math.round(byId('anchorage') / byId('pensacola')))
