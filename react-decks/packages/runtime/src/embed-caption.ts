const providers = new Set<() => { lead: string; body: string } | undefined>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeCaptions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Registers the active story card's plain text. Returns its cleanup. */
export function registerCaptionProvider(
  provider: () => { lead: string; body: string } | undefined,
): () => void {
  providers.add(provider);
  notify();
  return () => {
    providers.delete(provider);
    notify();
  };
}

export function embedCaption() {
  for (const provider of providers) {
    const caption = provider();
    if (caption) return caption;
  }
  return { lead: "", body: "" };
}
