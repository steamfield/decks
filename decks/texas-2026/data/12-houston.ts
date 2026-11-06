/**
 * Slide 12: TEA student-enrollment and accountability-summary via OpenData,
 * district 101912, queried 2026-11-06. Exact SQL and all rows in data-sources.md.
 * Enrollment sums mutually exclusive ethnicity categories, without a total row.
 * Ratings use each year's campus universe; cohort and methodology change.
 * Neither series estimates the causal effect of the intervention.
 */
export interface EnrollmentYear { readonly schoolYear: string; readonly enrollment: number }
export interface CampusRatingYear {
  readonly schoolYear: string
  readonly a: number | null
  readonly b: number | null
  readonly c: number | null
  readonly d: number | null
  readonly f: number | null
  readonly ab: number | null
  readonly df: number | null
  readonly notRated: number
  readonly total: number
}

// SELECT year, SUM(enrollment) ... WHERE district = 101912 GROUP BY year.
export const enrollmentSeries = [
  { schoolYear: '2018-2019', enrollment: 209772 },
  { schoolYear: '2019-2020', enrollment: 210061 },
  { schoolYear: '2020-2021', enrollment: 196943 },
  { schoolYear: '2021-2022', enrollment: 194607 },
  { schoolYear: '2022-2023', enrollment: 189934 },
  { schoolYear: '2023-2024', enrollment: 184109 },
  { schoolYear: '2024-2025', enrollment: 176727 },
  { schoolYear: '2025-2026', enrollment: 168812 },
] as const satisfies readonly EnrollmentYear[]

// COUNT campus rows by school_year and overall_rating; null means no comparable grade, not zero.
export const campusRatingSeries = [
  { schoolYear: '2018-2019', a: 58, b: 77, c: 86, d: 29, f: 21, ab: 135, df: 50, notRated: 8, total: 279 },
  { schoolYear: '2019-2020', a: null, b: null, c: null, d: null, f: null, ab: null, df: null, notRated: 280, total: 280 },
  { schoolYear: '2020-2021', a: null, b: null, c: null, d: null, f: null, ab: null, df: null, notRated: 274, total: 274 },
  { schoolYear: '2021-2022', a: 96, b: 117, c: 43, d: null, f: null, ab: 213, df: null, notRated: 17, total: 273 },
  { schoolYear: '2022-2023', a: 36, b: 57, c: 52, d: 65, f: 55, ab: 93, df: 120, notRated: 7, total: 272 },
  { schoolYear: '2023-2024', a: 59, b: 111, c: 54, d: 30, f: 11, ab: 170, df: 41, notRated: 9, total: 274 },
  { schoolYear: '2024-2025', a: 74, b: 124, c: 50, d: 17, f: 0, ab: 198, df: 17, notRated: 8, total: 273 },
  { schoolYear: '2025-2026', a: 92, b: 113, c: 46, d: 9, f: 5, ab: 205, df: 14, notRated: 7, total: 272 },
] as const satisfies readonly CampusRatingYear[]

// Derived from TEA fall snapshots: 2022-23 to 2025-26; Tribune 2026-09-21 rounds this to 21,000.
export const enrollmentChange = {
  baselineYear: '2022-2023', endYear: '2025-2026', baseline: 189934, end: 168812,
  lost: 189934 - 168812, roundedLost: 21000, elapsedSchoolYears: 3, status: 'confirmed',
} as const
// TEA 2025-06-02 intervention-extension notice: installed 2023-06-01; extended through 2027-06-01.
export const houstonIntervention = { district: 'Houston ISD', start: '2023-06-01', extendedThrough: '2027-06-01', status: 'confirmed', returnToElectedBoard: 'pending' } as const
export const houstonSeriesStatus = { status: 'confirmed', final2026Ratings: 'pending', causalAttribution: 'Not established' } as const
export const houstonSeriesQualifications = [
  'Enrollment was declining before the June 2023 intervention.',
  'Campus counts use changing annual cohorts.',
  'No ratings in 2020 or 2021; low 2022 results were Not Rated under SB 1365.',
  'The 2023 accountability refresh limits comparison with earlier ratings.',
  'The 2022-23 rating year is the pre-intervention baseline, even though publication was delayed.',
] as const
