import type { ReactElement } from "react";

/**
 * The compiled form of a ````md magic-move fence (architecture section 6.7). The node compiler
 * emits it with every step's keyed tokens; authors never write it by hand.
 */
export function MagicMove(_props: {
  steps: string;
  at: number;
  ranges: string;
  lines?: boolean;
  title?: string;
}): ReactElement {
  throw new Error("MagicMove is not implemented");
}
