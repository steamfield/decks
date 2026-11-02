/** Resize actual type, keeping the slide canvas and chart geometry fitted.
 * Decks mix rem, frame units, SVG attributes and inline chart styles, so use
 * their resolved sizes rather than changing the meaning of every layout unit.
 * All original inline declarations are restored before measuring or disposing.
 */
export function createTypographySizing() {
  type Styled = HTMLElement | SVGElement
  const originals = new Map<Styled, Array<[string, string, string, string]>>()
  let scale = 1
  let enabled = false
  let frame = 0
  const observer = new MutationObserver(records => {
    // Count-up animations replace text every frame; their parent already has
    // the right metrics. Only new text-bearing elements need another pass.
    if (records.some(record => record.target instanceof Element
      && record.target.closest('#slide-content')
      && [...record.addedNodes].some(node => node instanceof Element
        || (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() && !originals.has(record.target as Styled))))) schedule()
  })
  const observe = () => observer.observe(document.body, { childList: true, subtree: true })

  function restore() {
    for (const [element, properties] of originals) {
      for (const [name, value, priority, applied] of properties) {
        // Preserve a newer style written by Vue or the chart renderer.
        if (element.style.getPropertyValue(name) !== applied) continue
        if (value) element.style.setProperty(name, value, priority)
        else element.style.removeProperty(name)
      }
    }
    originals.clear()
  }
  function apply() {
    frame = 0
    observer.disconnect()
    restore()
    if (enabled && scale !== 1) {
      // Read all sizes before writing: inherited type must not compound.
      const measured = [...document.querySelectorAll('#slide-content .slidev-page *')]
        .filter((element): element is Styled => (element instanceof HTMLElement || element instanceof SVGElement)
          && !element.closest('script, style, textarea, input, [contenteditable="true"]')
          && [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
        .map(element => {
          const css = getComputedStyle(element)
          return { element, font: parseFloat(css.fontSize), line: parseFloat(css.lineHeight) }
        })
      for (const { element, font, line } of measured) {
        if (!Number.isFinite(font)) continue
        const sizes = [['font-size', `${font * scale}px`]]
        if (Number.isFinite(line)) sizes.push(['line-height', `${line * scale}px`])
        originals.set(element, sizes.map(([name, value]) => {
          const original = element.style.getPropertyValue(name)
          const priority = element.style.getPropertyPriority(name)
          element.style.setProperty(name, value, 'important')
          // CSSOM normalizes fractional lengths; compare its serialized value.
          return [name, original, priority, element.style.getPropertyValue(name)]
        }))
      }
    }
    observe()
  }
  function schedule() {
    if (!frame && enabled && scale !== 1) frame = requestAnimationFrame(apply)
  }
  observe()
  return {
    set(value: number, active: boolean) { scale = value; enabled = active; cancelAnimationFrame(frame); apply() },
    resize: schedule,
    dispose() { observer.disconnect(); cancelAnimationFrame(frame); restore() },
  }
}
