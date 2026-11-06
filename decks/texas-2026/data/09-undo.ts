/**
 * Slide 9: TEC §§39A.207-.209, read 2026-11-06.
 * Conditions apply to managers appointed under Subchapter C; see data-sources.md.
 */
// §39A.207 permits replacing an individual manager at any time.
export const replaceManager = { label: 'Replace individual managers', actor: 'TEA commissioner', timing: 'At any time', status: 'confirmed' } as const
// §39A.209(a): two acceptable consecutive school-year ratings at the triggering campus; removal is discretionary.
export const earlyRemoval = {
  label: 'Remove the board early', actor: 'TEA commissioner', acceptableRatings: 2,
  consecutive: true, scope: 'Campus that triggered the appointment',
  automatic: false, status: 'confirmed', aisdOutcomeStatus: 'pending',
  qualification: 'A ratings condition, not a guaranteed two-year return date',
} as const
// §39A.208(b)-(c): notice by second anniversary, possible extension, phased trustee return.
export const expiration = { noticeAnniversary: 2, maximumExtensionYears: 2, transitionYears: 3, trusteeFractionPerYear: 1 / 3, status: 'confirmed' } as const
// §39A.209(b)-(c): two further unacceptable years permit a replacement board; supplementary oversight can follow removal.
export const furtherFailure = { unacceptableYears: 2, communityConsultation: true, replacementBoardPermitted: true, monitorAfterRemovalPermitted: true, status: 'confirmed' } as const
