/** The runtime removes this documented attribute after its ViewTransition finishes. */
export function afterTransition(run: () => void): () => void {
  const html = document.documentElement;
  if (!html.hasAttribute("data-deck-transition")) {
    run();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (html.hasAttribute("data-deck-transition")) return;
    observer.disconnect();
    run();
  });
  observer.observe(html, { attributes: true, attributeFilter: ["data-deck-transition"] });
  return () => observer.disconnect();
}
