// Mounts DeckStage on a test-only page (bundled and served by e2e/deck-stage.spec.ts) and
// records what the spec asserts: the deck's settled states and, on every DOM change, whether
// the poster or the frame is showing.
import { createRoot } from "react-dom/client";
import { DeckStage } from "../../src/components/landing/DeckStage";
import { type DeckState, parseDeckMessage } from "../../src/lib/player/protocol";
import type { StageController } from "../../src/lib/stage/controller";

declare global {
  interface Window {
    stage?: StageController;
    settledStates: DeckState[];
    swapLog: { poster: boolean; frame: boolean }[];
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("The harness page has no #root");
window.settledStates = [];
window.swapLog = [];

const snapshot = () => {
  const frame = root.querySelector("iframe");
  window.swapLog.push({
    poster: root.querySelector("picture img") !== null,
    frame: frame !== null && getComputedStyle(frame).visibility === "visible",
  });
};
new MutationObserver(snapshot).observe(root, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["style"],
});

window.addEventListener("message", (event) => {
  const frame = root.querySelector("iframe");
  if (!frame || event.source !== frame.contentWindow) return;
  const message = parseDeckMessage(event.data);
  if (message?.type === "decks:state" && message.settled && message.requestId !== undefined) {
    const { type: _, ...state } = message;
    window.settledStates.push(state);
  }
});

createRoot(root).render(
  <DeckStage
    src="/d/agent-hero/index.html"
    poster={{ base: "/posters/agent-hero", width: 1920, height: 1080 }}
    label="The deck the agent built"
    initialHash="/1"
    onController={(controller) => {
      window.stage = controller ?? undefined;
    }}
  />,
);
