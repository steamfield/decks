export { runCli } from "./cli/cli-command";
export { type DeckConfig, defineDeck, loadDeck, type ResolvedDeck } from "./dev/config";
export { reactDecks } from "./dev/plugins";
export { build, type DevServer, dev } from "./dev/server";
export { buildManifest, type ScannedSlide, scanSlides } from "./mdx/slides";
