/**
 * The Illinois State Board of Education report card corpus, as sheets.
 *
 * One annual file per school year from 1997 to 2025: twenty nine years, twenty
 * nine files. The span is the MIN and MAX year in `isbe/report-card:all`; the
 * file count is one per year, which is how ISBE publishes the report card.
 *
 * The raw row and the SQL are both recorded in `data-sources.md`. The row is
 * illustrative of the file's shape (semicolon delimited, no header, about
 * 7,691 fields) rather than a transcription of a specific record. The query is
 * a real query shape against the published dataset.
 */

/**
 * Structurally the `UnitGridItem` shape. Declared here rather than imported
 * from the component, because `tsc` does not read `.vue` files.
 */
export interface FileSheet {
  id: string
  category?: string
}

export const FIRST_FILE_YEAR = 1997
export const LAST_FILE_YEAR = 2025

export const FILE_YEARS: number[] = Array.from(
  { length: LAST_FILE_YEAR - FIRST_FILE_YEAR + 1 },
  (_, i) => FIRST_FILE_YEAR + i,
)

export const FILE_COUNT = FILE_YEARS.length

/** One sheet per annual file. */
export const FILE_SHEETS: FileSheet[] = FILE_YEARS.map((year) => ({
  id: `isbe-${year}`,
  category: String(year),
}))

/** Fields per row in the raw file, spoken as "about 7,691". */
export const RAW_FIELD_COUNT = 7691

/**
 * Six rows, each cut short with an ellipsis: the real row runs to about
 * 7,691 fields and a frame full of semicolons reads as a rendering fault
 * rather than as data. They are longer than the block they sit in, which is
 * the point of that block: it scrolls sideways, so the row runs past the
 * frame edge on stage and can be wheeled across. These are the ISBE row *shape*, not records: the
 * delimiter, the empty-field runs and the field count are real, and every
 * value is illustrative. The school-name field is elided rather than filled
 * in, because a real Aurora school name beside an invented salary reads as a
 * transcription. The label on stage says shape only for the same reason.
 */
export const RAW_ROWS = [
  '150162990250001;… ELEM;AURORA;89.4;;;12.1;;;;41522;;;;;7.2;;;;0;;;;;;;3;;;;;;;;;;;;;;;;;;;;;;;;18.6;;;;;;2;;;;;;;;;;;;;;;91.2;;;;;;;;;;;;;;;;;;;;;;0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
  '150162990252003;… ELEM;AURORA;91.7;;;9.8;;;;43108;;;;;6.5;;;;0;;;;;;;2;;;;;;;;;;;;;;;;;;;;;;;;21.4;;;;;;1;;;;;;;;;;;;;;;88.7;;;;;;;;;;;;;;;;;;;;;;0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
  '150162990252007;… HS;AURORA;93.2;;;14.6;;;;58974;;;;;11.3;;;;1;;;;;;;4;;;;;;;;;;;;;;;;;;;;;;;;24.9;;;;;;3;;;;;;;;;;;;;;;94.1;;;;;;;;;;;;;;;;;;;;;;2;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
  '150162990252011;… ELEM;AURORA;87.5;;;16.2;;;;39860;;;;;9.4;;;;0;;;;;;;5;;;;;;;;;;;;;;;;;;;;;;;;19.8;;;;;;2;;;;;;;;;;;;;;;85.3;;;;;;;;;;;;;;;;;;;;;;1;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
  '150162990252026;… MS;AURORA;90.1;;;11.7;;;;46215;;;;;8.1;;;;0;;;;;;;1;;;;;;;;;;;;;;;;;;;;;;;;22.7;;;;;;4;;;;;;;;;;;;;;;89.6;;;;;;;;;;;;;;;;;;;;;;0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
  '150162990252034;… HS;AURORA;94.8;;;13.3;;;;61402;;;;;12.6;;;;2;;;;;;;3;;;;;;;;;;;;;;;;;;;;;;;;26.1;;;;;;1;;;;;;;;;;;;;;;92.4;;;;;;;;;;;;;;;;;;;;;;3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; …',
]

export const RAW_LABEL = `rc25.txt · row shape only · ${RAW_FIELD_COUNT.toLocaleString('en-US')} fields each · no header`

/** A real query shape against the published dataset. */
export const RECONCILED_SQL = [
  'SELECT year, school_name, teacher_avg_salary',
  'FROM "isbe/report-card:all"',
  "WHERE city = 'AURORA'",
  'ORDER BY year',
]

export const SQL_LABEL = `one query · ${FILE_COUNT} years · ${FILE_COUNT} files reconciled`

/**
 * The same query, open in the workbench and already run. Built from
 * RECONCILED_SQL so the card and the link cannot drift.
 *
 * `/sandbox` requires a signed in account; a signed out visitor lands on its
 * upsell rather than on the editor.
 */
export const RECONCILED_SQL_URL = `https://tryopendata.ai/sandbox?sql=${encodeURIComponent(
  RECONCILED_SQL.join('\n'),
)}&autorun=1`

/** The published dataset the files become. */
export const DATASET_NAME = 'isbe/report-card'

/** Its page in the product. The card on slide 3 opens this in a new tab. */
export const DATASET_URL = `https://tryopendata.ai/datasets/${DATASET_NAME}`

/**
 * The card's meta line. Slide 3 counts the files up as they land, slide 4
 * renders the settled card, so both go through this rather than each writing
 * the format string out.
 */
export const datasetMeta = (files: number = FILE_COUNT): string =>
  `${files} files · ${FIRST_FILE_YEAR} to ${LAST_FILE_YEAR} · one schema`

export const DATASET_META = datasetMeta()

/**
 * Where the dataset card sits, as percentages of the stage. Slides 3 and 4
 * both place the card from this box, so the view transition carries it
 * across unchanged before slide 4 moves it into the field.
 *
 * It takes the left column, at the prose card's width and gutter, and its
 * centre line is the centre line of the band between the headline and that
 * card: on slide 3's second beat the query stands opposite it in the right
 * column, so the two read as one row.
 */
export const DATASET_CARD_BOX = { left: 5.7, top: 29.5, width: 36, height: 13 }
