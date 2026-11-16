import { fileURLToPath } from "node:url";
import { defineDeck } from "@steamfield/decks/node";
import { liveTerm } from "./term/server/plugin";

export default defineDeck({
  title: "Building for agents",
  author: "Riley Hilliard",
  info: "Using TypeScript to build agent tooling and infrastructure, from CLIs to a native macOS app. Austin JS, November 2026.",
  transition: "story",
  vite: {
    plugins: [
      liveTerm({
        enabled: process.env.DECKS_LIVE_TERM === "1",
        dirs: { repo: fileURLToPath(new URL("../../", import.meta.url)) },
        shell: ["zsh", "-f"],
        promptMarker: "\u001b]133;A\u0007",
      }),
    ],
  },
});
