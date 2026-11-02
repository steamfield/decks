/**
 * Slide 6: ten Texas districts on STAAR, then the seven of them that have a
 * comparable SAT figure.
 *
 * Both arrays are copied from the previous deck's charts
 * (`talks/opendata-pitch/pages/07-tea.md`), which took them from the article
 * `blog/src/content/blog/staar-sat-gap.mdx`. Nothing was re-queried and no
 * value was recomputed. Provenance, including the two caveats that matter on
 * stage, is in `data-sources.md` under "Slide 6".
 *
 * The two caveats, restated here because this file is where someone would
 * reach for a shortcut:
 *
 * - IDEA Public Schools carries a STAAR figure of 35 in the source data and is
 *   deliberately absent, because it is a charter network rather than a
 *   traditional district and the slide is a district to district comparison.
 * - Austin's all-student SAT mean (1046) is likewise absent. Every SAT number
 *   here is the economically disadvantaged subgroup, and mixing the two is the
 *   one error that would invert the slide's point.
 */
import type { InkBarRow } from 'slidev-addon-decks/story'

/**
 * STAAR math "meets grade level" rate among economically disadvantaged
 * students, 2024-25. `tea/staar-accountability`, metric DDE00AM01225R.
 */
export const STAAR_ROWS: InkBarRow[] = [
  { id: 'roma', label: 'Roma ISD', value: 64, text: '64%' },
  { id: 'south-texas', label: 'South Texas ISD', value: 57, text: '57%' },
  { id: 'valley-view', label: 'Valley View ISD', value: 52, text: '52%' },
  { id: 'sharyland', label: 'Sharyland ISD', value: 49, text: '49%' },
  { id: 'brownsville', label: 'Brownsville ISD', value: 47, text: '47%' },
  { id: 'psja', label: 'PSJA ISD', value: 45, text: '45%' },
  { id: 'la-joya', label: 'La Joya ISD', value: 36, text: '36%' },
  { id: 'mission', label: 'Mission CISD', value: 35, text: '35%' },
  { id: 'point-isabel', label: 'Point Isabel ISD', value: 32, text: '32%' },
  { id: 'austin', label: 'Austin ISD', value: 22, text: '22%' },
]

/**
 * SAT mean total, same economically disadvantaged subgroup, Class of 2024,
 * districts clearing 50% eco-dis SAT participation. `tea/sat-act-campus`.
 */
export const SAT_ROWS: InkBarRow[] = [
  { id: 'south-texas', label: 'South Texas ISD', value: 979, text: '979' },
  { id: 'brownsville', label: 'Brownsville ISD', value: 932, text: '932' },
  { id: 'sharyland', label: 'Sharyland ISD', value: 929, text: '929' },
  { id: 'austin', label: 'Austin ISD', value: 886, text: '886' },
  { id: 'psja', label: 'PSJA ISD', value: 875, text: '875' },
  { id: 'point-isabel', label: 'Point Isabel ISD', value: 871, text: '871' },
  { id: 'mission', label: 'Mission CISD', value: 862, text: '862' },
]

/** The three districts with no comparable SAT figure, so the three that exit. */
export const NO_SAT_IDS = STAAR_ROWS.filter(
  (row) => !SAT_ROWS.some((sat) => sat.id === row.id),
).map((row) => row.id)

export const STAAR_DOMAIN: [number, number] = [0, 70]
/**
 * The SAT axis starts at 800, not at zero, because 400 is the floor of the
 * scale and a zero based axis would compress every district into the same
 * stub. The beat labels both ends of the axis so the truncation is on screen
 * rather than implied.
 */
export const SAT_DOMAIN: [number, number] = [800, 1000]

/** Roma's eco-dis STAAR rate over Austin's, to one decimal. */
export const ROMA_OVER_AUSTIN =
  Math.round(
    ((STAAR_ROWS.find((r) => r.id === 'roma')?.value ?? 0) /
      (STAAR_ROWS.find((r) => r.id === 'austin')?.value ?? 1)) *
      10,
  ) / 10

/**
 * The published analysis every figure here comes from. The divider before the
 * slide and the slide itself both link it, so it lives beside the rows.
 */
export const ARTICLE_URL = 'https://labs.tryopendata.ai/staar-sat-gap'

/* ── Stage geometry ── */
export const BAR_X: [number, number] = [1200, 1780]
export const BAR_BAND: [number, number] = [410, 900]
