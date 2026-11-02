// The event catalog. track() accepts only these names. Name events object_verb in
// the past tense (install_copied) and keep properties snake_case. No SDK import here,
// so server code and tests can read the catalog without loading posthog-js.
export const Events = {
  /** An install command was copied; `method` is hero, bun, npm or pnpm. */
  installCopied: "install_copied",
  /** PLAY was pressed on the deck player; `tape` is the deck name. */
  playerPlayed: "player_played",
  /** A transport step was used; `cmd` is next, prev, nextSlide or prevSlide. */
  beatStepped: "beat_stepped",
  /** A cassette was picked from the rack; `tape` is the deck name. */
  tapeSelected: "tape_selected",
  /** The NORMAL/WARM switch moved; `position` is normal or warm. */
  themeSwitched: "theme_switched",
  /** The Quickstart docs page was viewed. */
  docsQuickstartViewed: "docs_quickstart_viewed",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// Property values are flat scalars: never free text a user typed, emails or tokens.
export type EventProps = Record<string, string | number | boolean | null>;
