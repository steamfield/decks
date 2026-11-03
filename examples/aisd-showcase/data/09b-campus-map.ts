/**
 * Slide 12: AISD campus map colored by economically disadvantaged share,
 * then by TEA accountability rating.
 *
 * 112 mappable rated campuses in Austin ISD, 2025-2026 (FY26). Coordinates come
 * from `tea/school-locations` via the blog's `staar-sat-gap-geo.ts`; every
 * rating, eco-dis share and enrollment was re-pulled from FY26 on 2026-09-16:
 *
 *   SELECT campus_number, campus, overall_rating, overall_score,
 *          economically_disadvantaged, number_of_students
 *   FROM tea/accountability-summary
 *   WHERE district_number = '227901' AND school_year = '2025-2026'
 *     AND campus_number IS NOT NULL
 *   ORDER BY campus_number
 *
 * That refresh changed 47 ratings off the 2024-25 vintage the rows were copied
 * from, and moved every eco-dis share and enrollment to the same FY26 year, so
 * the dots carry one vintage rather than two. Two campuses (Graduation
 * Preparatory Academy, Graduation Prep Academy Navarro) have no FY26 record and
 * were dropped: 114 rows became 112.
 *
 * Color scales: eco-dis dark ramp from `blog/src/components/rgv-recapture-charts/ecoDisScale.ts`,
 * TEA rating palette from `blog/src/components/rgv-recapture-charts/AisdRatingsMapScrolly.tsx`.
 *
 * Basemap: `public/austin-zips.json`, Census TIGERweb 2020 ZCTAs clipped to
 * the AISD campus bounding box, copied from `blog/src/data/geo/austin-zips.json`.
 *
 * General Marshall Middle (FY26 rating D) geocodes to 0,0 and is excluded, as is
 * Blazier Pri (FY26 B), which has no coordinates in the source join.
 */

export interface CampusRow {
  campus: string
  lat: number
  lon: number
  ecoDis: number
  enrollment: number
  rating: string
  campusNumber: string
  [k: string]: unknown
}

export const AISD_CAMPUSES: CampusRow[] = [
  { campus: "AKINS EARLY COLLEGE H S", lat: 30.1493, lon: -97.8027, ecoDis: 0.61, enrollment: 2354, rating: "C", campusNumber: "227901017" },
  { campus: "ALLISON EL", lat: 30.2361, lon: -97.6921, ecoDis: 0.9, enrollment: 290, rating: "F", campusNumber: "227901101" },
  { campus: "ANDERSON H S", lat: 30.3761, lon: -97.7543, ecoDis: 0.227, enrollment: 2173, rating: "B", campusNumber: "227901009" },
  { campus: "ANDREWS EL", lat: 30.3179, lon: -97.6806, ecoDis: 0.966, enrollment: 294, rating: "C", campusNumber: "227901102" },
  { campus: "AUSTIN H S", lat: 30.2743, lon: -97.7664, ecoDis: 0.231, enrollment: 2292, rating: "A", campusNumber: "227901002" },
  { campus: "AUSTIN ISD PREK PARTNERSHIP (PKP)", lat: 30.2801, lon: -97.7198, ecoDis: 0.627, enrollment: 233, rating: "B", campusNumber: "227901194" },
  { campus: "BAILEY MIDDLE", lat: 30.1635, lon: -97.8735, ecoDis: 0.304, enrollment: 759, rating: "B", campusNumber: "227901059" },
  { campus: "BALDWIN EL", lat: 30.1843, lon: -97.9224, ecoDis: 0.118, enrollment: 507, rating: "A", campusNumber: "227901187" },
  { campus: "BARANOFF EL", lat: 30.1529, lon: -97.8524, ecoDis: 0.143, enrollment: 764, rating: "A", campusNumber: "227901182" },
  { campus: "BARRINGTON EL", lat: 30.3601, lon: -97.6961, ecoDis: 0.971, enrollment: 307, rating: "F", campusNumber: "227901149" },
  { campus: "BARTON HILLS EL", lat: 30.254, lon: -97.7829, ecoDis: 0.077, enrollment: 271, rating: "A", campusNumber: "227901103" },
  { campus: "BEAR CREEK EL", lat: 30.171, lon: -97.9106, ecoDis: 0.036, enrollment: 522, rating: "A", campusNumber: "227901195" },
  { campus: "BECKER EL", lat: 30.2503, lon: -97.76, ecoDis: 0.184, enrollment: 528, rating: "A", campusNumber: "227901104" },
  { campus: "BEDICHEK MIDDLE", lat: 30.1951, lon: -97.7854, ecoDis: 0.85, enrollment: 607, rating: "C", campusNumber: "227901054" },
  { campus: "BLACKSHEAR EL", lat: 30.2666, lon: -97.7219, ecoDis: 0.554, enrollment: 204, rating: "C", campusNumber: "227901105" },
  { campus: "BLANTON EL", lat: 30.3067, lon: -97.6897, ecoDis: 0.42, enrollment: 735, rating: "B", campusNumber: "227901106" },
  { campus: "BLAZIER EL", lat: 30.156, lon: -97.7529, ecoDis: 0.615, enrollment: 701, rating: "B", campusNumber: "227901185" },
  { campus: "BOONE EL", lat: 30.2042, lon: -97.8408, ecoDis: 0.317, enrollment: 388, rating: "B", campusNumber: "227901170" },
  { campus: "BOWIE H S", lat: 30.1885, lon: -97.8566, ecoDis: 0.135, enrollment: 2869, rating: "A", campusNumber: "227901013" },
  { campus: "BRENTWOOD EL", lat: 30.3409, lon: -97.7323, ecoDis: 0.135, enrollment: 694, rating: "A", campusNumber: "227901107" },
  { campus: "BROWN EL", lat: 30.3452, lon: -97.71, ecoDis: 0.943, enrollment: 419, rating: "C", campusNumber: "227901109" },
  { campus: "BRYKER WOODS EL", lat: 30.3055, lon: -97.7514, ecoDis: 0.136, enrollment: 273, rating: "B", campusNumber: "227901110" },
  { campus: "BURNET MIDDLE", lat: 30.3643, lon: -97.7265, ecoDis: 0.94, enrollment: 688, rating: "F", campusNumber: "227901046" },
  { campus: "CAMPBELL EL", lat: 30.2831, lon: -97.7139, ecoDis: 0.71, enrollment: 176, rating: "C", campusNumber: "227901111" },
  { campus: "CASEY EL", lat: 30.1769, lon: -97.8134, ecoDis: 0.538, enrollment: 558, rating: "B", campusNumber: "227901173" },
  { campus: "CASIS EL", lat: 30.3049, lon: -97.7648, ecoDis: 0.076, enrollment: 642, rating: "A", campusNumber: "227901112" },
  { campus: "CLAYTON EL", lat: 30.1958, lon: -97.9068, ecoDis: 0.028, enrollment: 633, rating: "A", campusNumber: "227901184" },
  { campus: "COOK EL", lat: 30.3781, lon: -97.704, ecoDis: 0.945, enrollment: 384, rating: "F", campusNumber: "227901161" },
  { campus: "COVINGTON MIDDLE", lat: 30.2117, lon: -97.8351, ecoDis: 0.466, enrollment: 625, rating: "C", campusNumber: "227901057" },
  { campus: "COWAN EL", lat: 30.1895, lon: -97.8331, ecoDis: 0.265, enrollment: 551, rating: "B", campusNumber: "227901183" },
  { campus: "CROCKETT EARLY COLLEGE H S", lat: 30.215, lon: -97.798, ecoDis: 0.636, enrollment: 1463, rating: "C", campusNumber: "227901008" },
  { campus: "CUNNINGHAM EL", lat: 30.2096, lon: -97.8063, ecoDis: 0.514, enrollment: 331, rating: "B", campusNumber: "227901113" },
  { campus: "DAVIS EL", lat: 30.4174, lon: -97.7419, ecoDis: 0.299, enrollment: 643, rating: "C", campusNumber: "227901179" },
  { campus: "DAWSON EL", lat: 30.2346, lon: -97.7644, ecoDis: 0.783, enrollment: 152, rating: "F", campusNumber: "227901114" },
  { campus: "DOBIE MIDDLE", lat: 30.3537, lon: -97.6807, ecoDis: 0.946, enrollment: 392, rating: "D", campusNumber: "227901055" },
  { campus: "DOSS EL", lat: 30.3569, lon: -97.7626, ecoDis: 0.178, enrollment: 934, rating: "B", campusNumber: "227901154" },
  { campus: "EASTSIDE EARLY COLLEGE H S", lat: 30.2704, lon: -97.7088, ecoDis: 0.837, enrollment: 584, rating: "C", campusNumber: "227901019" },
  { campus: "GALINDO EL", lat: 30.229, lon: -97.7711, ecoDis: 0.899, enrollment: 368, rating: "B", campusNumber: "227901176" },
  { campus: "GARCIA YMLA", lat: 30.311, lon: -97.6406, ecoDis: 0.975, enrollment: 243, rating: "B", campusNumber: "227901064" },
  { campus: "GARZA INDEPENDENCE H S", lat: 30.2775, lon: -97.7208, ecoDis: 0.348, enrollment: 132, rating: "B", campusNumber: "227901015" },
  { campus: "GORZYCKI MIDDLE", lat: 30.2144, lon: -97.8931, ecoDis: 0.075, enrollment: 1307, rating: "A", campusNumber: "227901062" },
  { campus: "GOVALLE EL", lat: 30.2645, lon: -97.6981, ecoDis: 0.868, enrollment: 372, rating: "F", campusNumber: "227901116" },
  { campus: "GRAHAM EL", lat: 30.3729, lon: -97.6695, ecoDis: 0.82, enrollment: 367, rating: "C", campusNumber: "227901159" },
  { campus: "GUERRERO THOMPSON", lat: 30.3608, lon: -97.6932, ecoDis: 0.975, enrollment: 520, rating: "B", campusNumber: "227901186" },
  { campus: "GULLETT EL", lat: 30.3432, lon: -97.7482, ecoDis: 0.076, enrollment: 540, rating: "A", campusNumber: "227901117" },
  { campus: "HARRIS EL", lat: 30.28, lon: -97.6864, ecoDis: 0.951, enrollment: 266, rating: "D", campusNumber: "227901118" },
  { campus: "HART EL", lat: 30.3437, lon: -97.6884, ecoDis: 0.944, enrollment: 531, rating: "D", campusNumber: "227901163" },
  { campus: "HIGHLAND PARK EL", lat: 30.3303, lon: -97.7594, ecoDis: 0.045, enrollment: 648, rating: "A", campusNumber: "227901119" },
  { campus: "HILL EL", lat: 30.3771, lon: -97.7493, ecoDis: 0.158, enrollment: 796, rating: "A", campusNumber: "227901155" },
  { campus: "HOUSTON EL", lat: 30.1982, lon: -97.7555, ecoDis: 0.898, enrollment: 443, rating: "D", campusNumber: "227901162" },
  { campus: "INTERNATIONAL H S", lat: 30.324, lon: -97.6897, ecoDis: 0.989, enrollment: 90, rating: "B", campusNumber: "227901029" },
  { campus: "JORDAN EL", lat: 30.3013, lon: -97.6475, ecoDis: 0.946, enrollment: 482, rating: "F", campusNumber: "227901178" },
  { campus: "JOSLIN EL", lat: 30.2275, lon: -97.7899, ecoDis: 0.441, enrollment: 245, rating: "B", campusNumber: "227901198" },
  { campus: "KEALING MIDDLE", lat: 30.2714, lon: -97.7215, ecoDis: 0.239, enrollment: 1232, rating: "A", campusNumber: "227901044" },
  { campus: "KIKER EL", lat: 30.1921, lon: -97.8814, ecoDis: 0.057, enrollment: 715, rating: "A", campusNumber: "227901180" },
  { campus: "KOCUREK EL", lat: 30.1776, lon: -97.8339, ecoDis: 0.668, enrollment: 476, rating: "C", campusNumber: "227901172" },
  { campus: "LAMAR MIDDLE", lat: 30.3379, lon: -97.7412, ecoDis: 0.17, enrollment: 1099, rating: "B", campusNumber: "227901045" },
  { campus: "LANGFORD EL", lat: 30.1649, lon: -97.7445, ecoDis: 0.978, enrollment: 319, rating: "C", campusNumber: "227901168" },
  { campus: "LASA H S", lat: 30.2574, lon: -97.6807, ecoDis: 0.104, enrollment: 1592, rating: "A", campusNumber: "227901018" },
  { campus: "LBJ EARLY COLLEGE H S", lat: 30.314, lon: -97.6577, ecoDis: 0.87, enrollment: 728, rating: "C", campusNumber: "227901014" },
  { campus: "LEE EL", lat: 30.2933, lon: -97.7271, ecoDis: 0.175, enrollment: 416, rating: "A", campusNumber: "227901121" },
  { campus: "LINDER EL", lat: 30.2264, lon: -97.7367, ecoDis: 0.939, enrollment: 619, rating: "F", campusNumber: "227901160" },
  { campus: "LIVELY MIDDLE", lat: 30.2447, lon: -97.7499, ecoDis: 0.68, enrollment: 919, rating: "C", campusNumber: "227901043" },
  { campus: "MAPLEWOOD EL", lat: 30.2929, lon: -97.7141, ecoDis: 0.188, enrollment: 426, rating: "A", campusNumber: "227901122" },
  { campus: "MARTIN MIDDLE", lat: 30.2536, lon: -97.7298, ecoDis: 0.922, enrollment: 308, rating: "F", campusNumber: "227901051" },
  { campus: "MATHEWS EL", lat: 30.278, lon: -97.7607, ecoDis: 0.313, enrollment: 377, rating: "A", campusNumber: "227901123" },
  { campus: "MCBEE EL", lat: 30.3837, lon: -97.6906, ecoDis: 0.947, enrollment: 300, rating: "B", campusNumber: "227901165" },
  { campus: "MCCALLUM H S", lat: 30.3257, lon: -97.7295, ecoDis: 0.188, enrollment: 1952, rating: "A", campusNumber: "227901005" },
  { campus: "MENCHACA EL", lat: 30.1405, lon: -97.8349, ecoDis: 0.449, enrollment: 621, rating: "D", campusNumber: "227901147" },
  { campus: "MENDEZ MIDDLE", lat: 30.1879, lon: -97.7436, ecoDis: 0.876, enrollment: 283, rating: "D", campusNumber: "227901058" },
  { campus: "MILLS EL", lat: 30.2118, lon: -97.8783, ecoDis: 0.061, enrollment: 701, rating: "A", campusNumber: "227901181" },
  { campus: "MURCHISON MIDDLE", lat: 30.3535, lon: -97.7589, ecoDis: 0.25, enrollment: 1254, rating: "A", campusNumber: "227901052" },
  { campus: "NAVARRO EARLY COLLEGE H S", lat: 30.3612, lon: -97.7076, ecoDis: 0.937, enrollment: 1391, rating: "B", campusNumber: "227901004" },
  { campus: "NORMAN-SIMS EL", lat: 30.2786, lon: -97.6744, ecoDis: 0.931, enrollment: 260, rating: "F", campusNumber: "227901150" },
  { campus: "NORTHEAST EARLY COLLEGE H S", lat: 30.324, lon: -97.6897, ecoDis: 0.917, enrollment: 952, rating: "C", campusNumber: "227901006" },
  { campus: "O HENRY MIDDLE", lat: 30.2847, lon: -97.7736, ecoDis: 0.279, enrollment: 657, rating: "B", campusNumber: "227901047" },
  { campus: "OAK HILL EL", lat: 30.2377, lon: -97.8595, ecoDis: 0.513, enrollment: 544, rating: "B", campusNumber: "227901148" },
  { campus: "OAK SPRINGS EL", lat: 30.2722, lon: -97.705, ecoDis: 0.977, enrollment: 213, rating: "F", campusNumber: "227901125" },
  { campus: "ODOM EL", lat: 30.2054, lon: -97.7899, ecoDis: 0.786, enrollment: 271, rating: "F", campusNumber: "227901156" },
  { campus: "ORTEGA EL", lat: 30.2701, lon: -97.6849, ecoDis: 0.81, enrollment: 211, rating: "B", campusNumber: "227901126" },
  { campus: "OVERTON EL", lat: 30.3028, lon: -97.636, ecoDis: 0.938, enrollment: 418, rating: "F", campusNumber: "227901189" },
  { campus: "PADRON EL", lat: 30.3739, lon: -97.7195, ecoDis: 0.944, enrollment: 500, rating: "C", campusNumber: "227901188" },
  { campus: "PALM EL", lat: 30.1649, lon: -97.7445, ecoDis: 0.866, enrollment: 299, rating: "B", campusNumber: "227901171" },
  { campus: "PAREDES MIDDLE", lat: 30.1664, lon: -97.8094, ecoDis: 0.826, enrollment: 593, rating: "F", campusNumber: "227901061" },
  { campus: "PATTON EL", lat: 30.2321, lon: -97.8461, ecoDis: 0.318, enrollment: 711, rating: "B", campusNumber: "227901143" },
  { campus: "PECAN SPRINGS EL", lat: 30.3024, lon: -97.6769, ecoDis: 0.971, enrollment: 240, rating: "F", campusNumber: "227901129" },
  { campus: "PEREZ EL", lat: 30.1698, lon: -97.754, ecoDis: 0.924, enrollment: 435, rating: "C", campusNumber: "227901190" },
  { campus: "PICKLE EL", lat: 30.3338, lon: -97.6936, ecoDis: 0.983, enrollment: 349, rating: "F", campusNumber: "227901164" },
  { campus: "PILLOW EL", lat: 30.3696, lon: -97.7332, ecoDis: 0.749, enrollment: 275, rating: "F", campusNumber: "227901151" },
  { campus: "PLEASANT HILL EL", lat: 30.1967, lon: -97.7766, ecoDis: 0.878, enrollment: 361, rating: "C", campusNumber: "227901130" },
  { campus: "REILLY EL", lat: 30.3285, lon: -97.7198, ecoDis: 0.374, enrollment: 318, rating: "B", campusNumber: "227901132" },
  { campus: "RICHARDS SCH FOR YOUNG WOMEN LEADERS", lat: 30.2377, lon: -97.7877, ecoDis: 0.332, enrollment: 921, rating: "A", campusNumber: "227901028" },
  { campus: "RIDGETOP EL", lat: 30.3116, lon: -97.7169, ecoDis: 0.163, enrollment: 375, rating: "A", campusNumber: "227901133" },
  { campus: "RODRIGUEZ EL", lat: 30.1993, lon: -97.7449, ecoDis: 0.962, enrollment: 341, rating: "B", campusNumber: "227901174" },
  { campus: "SADLER MEANS YWLA", lat: 30.3142, lon: -97.6813, ecoDis: 0.766, enrollment: 222, rating: "B", campusNumber: "227901065" },
  { campus: "SANCHEZ EL", lat: 30.258, lon: -97.7358, ecoDis: 0.845, enrollment: 348, rating: "D", campusNumber: "227901127" },
  { campus: "SMALL MIDDLE", lat: 30.2331, lon: -97.8407, ecoDis: 0.265, enrollment: 1233, rating: "A", campusNumber: "227901060" },
  { campus: "ST ELMO EL", lat: 30.2214, lon: -97.7737, ecoDis: 0.809, enrollment: 282, rating: "C", campusNumber: "227901136" },
  { campus: "SUMMITT EL", lat: 30.4192, lon: -97.7198, ecoDis: 0.254, enrollment: 745, rating: "B", campusNumber: "227901138" },
  { campus: "SUNSET VALLEY EL", lat: 30.2272, lon: -97.807, ecoDis: 0.3, enrollment: 444, rating: "A", campusNumber: "227901158" },
  { campus: "TRAVIS EARLY COLLEGE H S", lat: 30.2347, lon: -97.7437, ecoDis: 0.811, enrollment: 917, rating: "D", campusNumber: "227901007" },
  { campus: "TRAVIS HTS EL", lat: 30.241, lon: -97.746, ecoDis: 0.595, enrollment: 484, rating: "C", campusNumber: "227901140" },
  { campus: "UPHAUS EARLY CHILDHOOD CENTER", lat: 30.2013, lon: -97.7555, ecoDis: 0.782, enrollment: 257, rating: "B", campusNumber: "227901177" },
  { campus: "WALNUT CREEK EL", lat: 30.3801, lon: -97.6834, ecoDis: 0.906, enrollment: 404, rating: "D", campusNumber: "227901141" },
  { campus: "WEBB MIDDLE", lat: 30.3339, lon: -97.7065, ecoDis: 0.923, enrollment: 429, rating: "F", campusNumber: "227901053" },
  { campus: "WIDEN EL", lat: 30.1894, lon: -97.7413, ecoDis: 0.914, enrollment: 339, rating: "F", campusNumber: "227901175" },
  { campus: "WILLIAMS EL", lat: 30.1805, lon: -97.7915, ecoDis: 0.734, enrollment: 357, rating: "B", campusNumber: "227901166" },
  { campus: "WINN MONTESSORI", lat: 30.3138, lon: -97.6658, ecoDis: 0.586, enrollment: 370, rating: "C", campusNumber: "227901157" },
  { campus: "WOOLDRIDGE EL", lat: 30.3644, lon: -97.7102, ecoDis: 0.96, enrollment: 348, rating: "B", campusNumber: "227901152" },
  { campus: "WOOTEN EL", lat: 30.3339, lon: -97.7065, ecoDis: 0.924, enrollment: 236, rating: "F", campusNumber: "227901144" },
  { campus: "ZAVALA EL", lat: 30.258, lon: -97.7197, ecoDis: 0.906, enrollment: 202, rating: "D", campusNumber: "227901145" },
  { campus: "ZILKER EL", lat: 30.252, lon: -97.7739, ecoDis: 0.201, enrollment: 537, rating: "A", campusNumber: "227901146" },
]

// --- Economically disadvantaged color scale (dark ramp) ---
// Source: blog/src/components/rgv-recapture-charts/ecoDisScale.ts
export const ECO_DIS_DOMAIN = ['<30%', '30-50%', '50-70%', '70-85%', '85%+']
export const ECO_DIS_THRESHOLDS = [0.3, 0.5, 0.7, 0.85]
// One hue, five steps of rising brightness, so the eye ranks the dots the way
// the data does: the poorest campuses are the brightest thing on a black
// ground and the wealthiest sit just above the basemap. The blog's ramp moved
// through mid blues that read as heavier than the light end above them, which
// pulled attention to the wrong tail.
export const ECO_DIS_RANGE_DARK = [
  '#2c3a47', // Low: barely above the canvas
  '#2f5f76', // Mid-low
  '#2f8ba8', // Mid
  '#43bcd8', // Mid-high
  '#8ceeff', // High: brightest dot on the slide
]

export function ecoDisBucket(value: number): string {
  for (let i = 0; i < ECO_DIS_THRESHOLDS.length; i++) {
    if (value < ECO_DIS_THRESHOLDS[i]) return ECO_DIS_DOMAIN[i]
  }
  return ECO_DIS_DOMAIN[ECO_DIS_DOMAIN.length - 1]
}

// --- TEA rating palette ---
// Source: blog/src/components/rgv-recapture-charts/AisdRatingsMapScrolly.tsx
export const RATING_DOMAIN = ['A', 'B', 'C', 'D', 'F']
export const RATING_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
}
export const MUTED = '#6b7280'

/** Full-color rating range. */
export const RATING_RANGE = RATING_DOMAIN.map((r) => RATING_COLORS[r])

/** Mute everything except the given set; null = all vivid. */
export function ratingRange(emphasized: Set<string> | null): string[] {
  return RATING_DOMAIN.map((r) =>
    !emphasized || emphasized.has(r) ? RATING_COLORS[r] : MUTED,
  )
}

// Pre-bucketed data for the eco-dis step (nominal encoding needs a string field).
export const AISD_CAMPUSES_BUCKETED = AISD_CAMPUSES.map((d) => ({
  ...d,
  ecoDisBucket: ecoDisBucket(d.ecoDis),
}))

// Summary stats quoted in the card copy: F campuses avg 91% eco-dis (n=20,
// 90.68%), A campuses avg 16% (n=28, 15.55%). Unweighted means over the rows
// above, tea/accountability-summary school_year 2025-2026, computed 2026-09-16.
export const F_AVG_ECO_DIS = 0.91
export const A_AVG_ECO_DIS = 0.16

// Article URL for StoryLink.
export const ARTICLE_URL = 'https://labs.tryopendata.ai/staar-sat-gap'
