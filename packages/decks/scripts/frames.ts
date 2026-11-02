// Frame naming for the snap harness. A .ts file so tsc and vitest both read
// it; bun runs snap.mjs against it directly, no build step.

/** `s<slide>-c<clicks>.png` for a slide URL, so a directory sorts in deck order. */
export function frameName(url: string): string {
  const u = new URL(url)
  const slide = u.pathname.replace(/^\//, '') || '1'
  const clicks = u.searchParams.get('clicks') ?? '0'
  return `s${slide.padStart(2, '0')}-c${clicks}.png`
}
