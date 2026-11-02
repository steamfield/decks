/**
 * The white QR frame both ends of the slide 8 to slide 9 morph sit on.
 *
 * Slide 9 lays its QR card out from the deck gutter: the square is `size`
 * wide, its right edge sits `gutter` in from the right of the stage and its
 * top edge `top` down from the top. Slide 8 parks the seed it grows out of on
 * the centre that implies, so the morph is a growth in place.
 *
 * They are one constant because they were two: hand-placed endpoints in two
 * coordinate systems coincide at exactly 16:9 and drift apart everywhere else.
 * Both slides read these as inline custom properties, since scoped CSS cannot
 * import a module. The two offsets are in frame units (hundredths of the 16:9
 * box, from story-frame.css), not vw/vh: a viewport unit inside the frame drifts off
 * the ink the moment the window stops being 16:9.
 */
export const QR_FRAME_VARS = {
  /** Distance from the right of the stage to the frame's right edge. */
  '--od-qr-gutter': 'calc(5.7 * var(--sw))',
  /** Distance from the top of the stage to the frame's top edge. */
  '--od-qr-top': 'calc(14 * var(--sh))',
  /**
   * Rendered width of slide 9's white square, which is `OdQrCard`'s own frame
   * width. Square, so this is its height too.
   */
  '--od-qr-size': '240px',
  /** Slide 8's seed: small enough to read as a seed rather than a blank panel. */
  '--od-qr-seed': '44px',
} as const
