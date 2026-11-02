/**
 * The hairline that persists across slides 5, 6 and 7.
 *
 * It is the same rule three times: the zero line of the Ask answer chart on
 * slide 5, the value axis above the district bars on slide 6, and the floor
 * the two market comps stand on on slide 7. All three draw it at the same y
 * over the same x span, inside a `vt-baseline` layer, so the view transition
 * between the slides reads as one rule holding still while the frame around
 * it changes.
 *
 * Its y is set by slide 5 and everything else follows: the year over year
 * series is close to symmetric about zero, so the zero line lands near the
 * middle of whatever box the chart occupies, and that box has to clear both
 * the headline above it and the prose card below it.
 */
export const BASELINE_Y = 480

/**
 * The district bars slide hangs ten rows off its rule, so at 480 the block
 * sat low with a band of dead canvas under the headline. It draws the rule
 * higher, centring the block. The platform and OpenChart slides that follow
 * do not draw the rule (it read as a stray line under their stacks), so it
 * fades out here and comes back on the model slide at BASELINE_Y.
 */
export const BARS_BASELINE_Y = 380

/**
 * Left and right ends of the rule, in stage viewBox units. Also the right
 * column every story slide lays its figure in, whether or not it draws the rule.
 */
export const BASELINE_X: [number, number] = [1080, 1860]
