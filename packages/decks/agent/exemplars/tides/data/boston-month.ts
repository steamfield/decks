/**
 * Slides 2 and 4: every Boston high and low tide from January 10 to 31, 2025.
 *
 * NOAA CO-OPS tide predictions for station 8443970 (Boston, MA),
 * `interval=hilo`, 2025-01-01 to 2025-01-31 local time, metric, datum MLLW.
 * Rows from January 10 on are copied verbatim from the CSV response. The
 * window runs from three days before the full moon to two days after the new
 * moon, so it holds one spring, one neap, and a second spring.
 *
 * Moon phase instants: US Naval Observatory API,
 * https://aa.usno.navy.mil/api/moon/phases/date?date=2025-01-01&nump=8
 * (times UT; shifted five hours back to Boston standard time below so they
 * share the tide rows' clock).
 *
 * Both request URLs are recorded in data-sources.md under "Slide 4".
 */

type Row = [day: number, time: string, meters: number, kind: 'H' | 'L']

/** January 2025 day, local time, predicted meters above MLLW, high or low. */
const ROWS: Row[] = [
  [10, '01:11', 0.207, 'L'], [10, '07:30', 3.153, 'H'], [10, '14:02', -0.05, 'L'], [10, '20:16', 2.663, 'H'],
  [11, '02:12', 0.214, 'L'], [11, '08:31', 3.201, 'H'], [11, '15:03', -0.125, 'L'], [11, '21:17', 2.698, 'H'],
  [12, '03:09', 0.188, 'L'], [12, '09:27', 3.245, 'H'], [12, '15:58', -0.188, 'L'], [12, '22:13', 2.742, 'H'],
  [13, '04:03', 0.153, 'L'], [13, '10:20', 3.267, 'H'], [13, '16:50', -0.22, 'L'], [13, '23:04', 2.776, 'H'],
  [14, '04:54', 0.129, 'L'], [14, '11:11', 3.255, 'H'], [14, '17:38', -0.214, 'L'], [14, '23:53', 2.796, 'H'],
  [15, '05:43', 0.127, 'L'], [15, '11:59', 3.208, 'H'], [15, '18:23', -0.17, 'L'],
  [16, '00:38', 2.8, 'H'], [16, '06:30', 0.148, 'L'], [16, '12:45', 3.128, 'H'], [16, '19:05', -0.092, 'L'],
  [17, '01:20', 2.79, 'H'], [17, '07:15', 0.192, 'L'], [17, '13:29', 3.016, 'H'], [17, '19:47', 0.012, 'L'],
  [18, '02:02', 2.768, 'H'], [18, '08:01', 0.252, 'L'], [18, '14:13', 2.88, 'H'], [18, '20:28', 0.135, 'L'],
  [19, '02:43', 2.738, 'H'], [19, '08:47', 0.323, 'L'], [19, '14:58', 2.731, 'H'], [19, '21:11', 0.266, 'L'],
  [20, '03:27', 2.703, 'H'], [20, '09:37', 0.393, 'L'], [20, '15:47', 2.581, 'H'], [20, '21:56', 0.391, 'L'],
  [21, '04:13', 2.669, 'H'], [21, '10:28', 0.45, 'L'], [21, '16:38', 2.449, 'H'], [21, '22:44', 0.499, 'L'],
  [22, '05:01', 2.646, 'H'], [22, '11:22', 0.482, 'L'], [22, '17:33', 2.348, 'H'], [22, '23:34', 0.579, 'L'],
  [23, '05:52', 2.642, 'H'], [23, '12:18', 0.482, 'L'], [23, '18:30', 2.29, 'H'],
  [24, '00:26', 0.619, 'L'], [24, '06:45', 2.67, 'H'], [24, '13:14', 0.439, 'L'], [24, '19:28', 2.287, 'H'],
  [25, '01:19', 0.61, 'L'], [25, '07:39', 2.739, 'H'], [25, '14:10', 0.346, 'L'], [25, '20:24', 2.339, 'H'],
  [26, '02:13', 0.545, 'L'], [26, '08:31', 2.85, 'H'], [26, '15:01', 0.215, 'L'], [26, '21:14', 2.432, 'H'],
  [27, '03:03', 0.434, 'L'], [27, '09:18', 2.985, 'H'], [27, '15:47', 0.065, 'L'], [27, '21:59', 2.55, 'H'],
  [28, '03:50', 0.296, 'L'], [28, '10:04', 3.122, 'H'], [28, '16:31', -0.084, 'L'], [28, '22:42', 2.682, 'H'],
  [29, '04:36', 0.15, 'L'], [29, '10:48', 3.239, 'H'], [29, '17:14', -0.214, 'L'], [29, '23:25', 2.819, 'H'],
  [30, '05:21', 0.013, 'L'], [30, '11:33', 3.32, 'H'], [30, '17:56', -0.309, 'L'],
  [31, '00:08', 2.953, 'H'], [31, '06:08', -0.101, 'L'], [31, '12:19', 3.35, 'H'], [31, '18:40', -0.357, 'L'],
]

export const WINDOW_LABEL = 'January 10 to 31, 2025'
/** Window start and end in days since January 10 00:00. */
export const WINDOW_DAYS: [number, number] = [0, 22]

/** Days since January 10 00:00 local. */
function dayOf(day: number, time: string): number {
  const [h, m] = time.split(':').map(Number)
  return day - 10 + (h + m / 60) / 24
}

/** The zigzag the stage draws: x in days since Jan 10, y in meters. */
export const EXTREMES = ROWS.map(([d, t, y, kind]) => ({ x: dayOf(d, t), y, kind }))

/** EST is UT minus five hours, in days. */
const UT_TO_EST = -5 / 24

/** USNO phase instants inside the window, as days since Jan 10 00:00 EST. */
export const PHASES = [
  { id: 'full', label: 'Full moon', x: dayOf(13, '22:27') + UT_TO_EST },
  { id: 'last', label: 'Last quarter', x: dayOf(21, '20:31') + UT_TO_EST },
  { id: 'new', label: 'New moon', x: dayOf(29, '12:36') + UT_TO_EST },
]

/** One swing per adjacent high/low pair, placed at the pair's midpoint. */
const SWINGS = EXTREMES.slice(1).map((b, i) => {
  const a = EXTREMES[i]
  return { x: (a.x + b.x) / 2, size: Math.abs(b.y - a.y), top: Math.max(a.y, b.y) }
})

/** Biggest (or smallest) swing within 1.5 days of a phase instant. */
function swingNear(phaseX: number, pick: 'max' | 'min') {
  const near = SWINGS.filter((s) => Math.abs(s.x - phaseX) <= 1.5)
  return near.reduce((best, s) => ((pick === 'max' ? s.size > best.size : s.size < best.size) ? s : best))
}

/** Spring swing at the new moon: 3.63 m (Jan 30 11:33 high to 17:56 low). */
export const SPRING = swingNear(PHASES[2].x, 'max')
/** Neap swing at the last quarter: 1.77 m (Jan 22 17:33 high to 23:34 low). */
export const NEAP = swingNear(PHASES[1].x, 'min')
export const SPRING_LABEL = `${SPRING.size.toFixed(1)} m`
export const NEAP_LABEL = `${NEAP.size.toFixed(1)} m`

/**
 * Average spacing between consecutive high tides across the window: 42 highs
 * from Jan 10 07:30 to Jan 31 12:19, so 41 gaps over 508.8 hours = 12.41 h.
 */
const highs = EXTREMES.filter((e) => e.kind === 'H')
export const HIGH_GAP_HOURS = ((highs[highs.length - 1].x - highs[0].x) * 24) / (highs.length - 1)
/** "12 h 25 min". */
export const HIGH_GAP_LABEL = `${Math.floor(HIGH_GAP_HOURS)} h ${Math.round((HIGH_GAP_HOURS % 1) * 60)} min`
