/**
 * Stage geometry shared by the cover and every chart slide, in 1920x1080
 * viewBox units. No figures live here.
 *
 * One plot box for the whole deck, so the cover's curve, the record, the
 * season zoom, the decade columns and the halfway line all sit in the same
 * place. Slides 2 to 5 draw their baseline at `Y_RANGE[0]` across `X_RANGE`
 * inside a `vt-baseline` layer, so the view transition between two of them
 * reads as one rule holding still while the chart above it changes. The
 * cover and Slides 2 and 3 draw the monthly record at exactly the same
 * geometry inside a `vt-keeling-line` layer, so the line holds still too.
 */

/** Plot box, left to right. */
export const X_RANGE: [number, number] = [260, 1640]

/** Plot box, bottom first (the baseline), then the top. */
export const Y_RANGE: [number, number] = [660, 230]

/** Baseline of the x-axis labels under the rule. */
export const TICK_Y = Y_RANGE[0] + 52

/** Right edge of the y-axis labels, left of the plot. */
export const GRID_LABEL_X = X_RANGE[0] - 24
