/**
 * Slide 2: Boston Harbor water level, hour by hour, over two days.
 *
 * NOAA CO-OPS tide predictions for station 8443970 (Boston, MA), hourly,
 * 2025-06-11 00:00 to 2025-06-12 23:00 local time, metric, datum MLLW (mean
 * lower low water). The request URL is recorded in data-sources.md under
 * "Slide 2". Values are copied verbatim from the CSV response.
 */

/** The two days the series covers, as the card names them. */
export const DAYS_LABEL = 'June 11 and 12, 2025'

/** Predicted level in meters above MLLW, one value per hour from 00:00 on June 11. */
const HOURLY_M = [
  3.045, 2.807, 2.334, 1.711, 1.028, 0.443, 0.171, 0.284, 0.656, 1.18, 1.793, 2.33,
  2.612, 2.59, 2.311, 1.853, 1.307, 0.798, 0.53, 0.645, 1.06, 1.611, 2.217, 2.76,
  3.055, 3.015, 2.678, 2.126, 1.459, 0.787, 0.284, 0.141, 0.375, 0.829, 1.395, 1.993,
  2.458, 2.643, 2.528, 2.169, 1.661, 1.114, 0.666, 0.513, 0.753, 1.254, 1.843, 2.435,
]

/** x is hours since 00:00 June 11, y is meters above MLLW. */
export const HOURLY = HOURLY_M.map((y, x) => ({ x, y }))

/**
 * The high tides inside the window, from the same station's `interval=hilo`
 * predictions for June 2025 (second request under "Slide 2" in
 * data-sources.md): 12:25 on June 11, 00:23 and 13:06 on June 12.
 */
export const HIGHS = [
  { x: 12 + 25 / 60, y: 2.638 },
  { x: 24 + 23 / 60, y: 3.079 },
  { x: 37 + 6 / 60, y: 2.644 },
]
