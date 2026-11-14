export { runCli } from "./cli-command";
export { type DeckConfig, defineDeck, loadDeck, type ResolvedDeck } from "./config";
export { reactDecks } from "./plugins";
export { build, type DevServer, dev } from "./server";
export { buildManifest, type ScannedSlide, scanSlides } from "./slides";
