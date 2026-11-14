import type { ReactElement } from "react";

/** The default corner credit. The mark is the Decks logo, drawn in the slide's own text color. */
export function DeckCredit(): ReactElement {
  return (
    <a className="rd-credit" href="https://decks.steamfield.io" target="_blank" rel="noopener">
      Created with{" "}
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          opacity="0.55"
          d="M12 4.75H27a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-2.5v-3.5a4.5 4.5 0 0 0-4.5-4.5H9v-3.5a3 3 0 0 1 3-3Z"
        />
        <rect x="2" y="12.75" width="21" height="14.5" rx="3" />
      </svg>
      <strong>Decks</strong>
    </a>
  );
}
