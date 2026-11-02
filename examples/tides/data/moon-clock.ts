/**
 * Slides 2 to 4: the astronomical constants behind the tide's timing and size.
 *
 * NASA NSSDCA fact sheets, read 2026-11-02:
 * - Moon: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
 *   mass 0.07346e24 kg, semimajor axis 0.3844e6 km, synodic period 29.53 days.
 * - Sun: https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
 *   mass 1,988,400e24 kg, mean distance from Earth 149.6e6 km.
 *
 * Both derived figures are computed here, not typed: see data-sources.md.
 */

const MOON_MASS = 0.07346 // 1e24 kg
const MOON_DIST = 0.3844 // 1e6 km
const SUN_MASS = 1988400 // 1e24 kg
const SUN_DIST = 149.6 // 1e6 km
const SYNODIC_DAYS = 29.53

/**
 * The lunar day: how long Earth takes to turn back under the Moon. The Moon
 * moves 1/29.53 of a lap eastward each solar day, so a full turn relative to
 * it takes 24 / (1 - 1/29.53) hours = 24.84 h.
 */
export const LUNAR_DAY_HOURS = 24 / (1 - 1 / SYNODIC_DAYS)
const lunarMinutes = Math.round((LUNAR_DAY_HOURS - 24) * 60)
/** "24 hours 50 minutes". */
export const LUNAR_DAY_LABEL = `24 hours ${lunarMinutes} minutes`

/**
 * Tide-raising force scales with mass over distance cubed, so the Sun's tidal
 * pull relative to the Moon's is (Ms/Mm) * (dm/ds)^3 = 0.459.
 */
export const SUN_TO_MOON = (SUN_MASS / MOON_MASS) * (MOON_DIST / SUN_DIST) ** 3
/** "46%". */
export const SUN_TO_MOON_LABEL = `${Math.round(SUN_TO_MOON * 100)}%`
