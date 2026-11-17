import type { TermPaneSpec } from "@react-decks/core";
import type { ReactElement, ReactNode } from "react";

/**
 * A live terminal pane (architecture section 7.2): `fallback` (the deck's recording) unless the
 * dev server runs with `--live-term` and this is the active slide in the play view.
 */
export function LiveTerm(_props: {
  pane: TermPaneSpec;
  click: number;
  fallback: ReactNode;
}): ReactElement {
  throw new Error("LiveTerm is not implemented");
}
