import { afterEach, expect, it, vi } from "vitest";
import { makeSource } from "./deck.test-support";
import { installEmbed } from "./embed";
import { createDeckStore } from "./store";

afterEach(() => vi.unstubAllGlobals());

it("stops accepting commands and reporting interactions after disposal", async () => {
  const parent = window;
  const frame = document.createElement("iframe");
  frame.src = "/?decks-bridge=1#/2";
  document.body.append(frame);
  const child = frame.contentWindow;
  if (!child) throw new Error("Missing embed window");
  vi.stubGlobal("window", child);
  const button = document.createElement("button");
  button.textContent = "Explore";
  const html = child.document.createElement("html");
  const body = child.document.createElement("body");
  html.append(body);
  child.document.append(html);
  body.append(button);
  const source = makeSource();
  const store = createDeckStore(source.manifest);
  const messages: unknown[] = [];
  const receive = (event: MessageEvent<unknown>) => messages.push(event.data);
  parent.addEventListener("message", receive);
  const embed = installEmbed(source.manifest, store);
  if (!embed) throw new Error("Embed did not activate");
  const send = () =>
    child.dispatchEvent(
      new MessageEvent("message", {
        source: child.parent,
        origin: parent.location.origin,
        data: { type: "decks:cmd", cmd: "next" },
      }),
    );
  const interact = () => {
    child.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    child.dispatchEvent(new Event("pointerdown"));
    button.dispatchEvent(new Event("pointerover", { bubbles: true }));
    button.dispatchEvent(new Event("focusin", { bubbles: true }));
  };
  try {
    embed.start();
    send();
    expect(child.location.hash).toBe("#/2?clicks=1");
    interact();
    embed.dispose();
    // A later parent message is a sentinel for all earlier postMessage deliveries.
    const delivered = new Promise<void>((resolve) => {
      parent.addEventListener("message", function sentinel(event) {
        if (event.data !== "sentinel") return;
        parent.removeEventListener("message", sentinel);
        resolve();
      });
    });
    send();
    interact();
    parent.postMessage("sentinel", parent.location.origin);
    await delivered;
    expect(child.location.hash).toBe("#/2?clicks=1");
    expect(messages).toEqual([
      { type: "decks:ready" },
      {
        type: "decks:meta",
        title: "Fixture",
        slides: 5,
        slideTitles: source.manifest.slides.map((slide) => slide.title),
      },
      { type: "decks:interaction" },
      { type: "decks:navigate", cmd: "next" },
      { type: "decks:interaction" },
      { type: "decks:interaction" },
      { type: "decks:interaction" },
      "sentinel",
    ]);
  } finally {
    embed.dispose();
    store.destroy();
    parent.removeEventListener("message", receive);
    frame.remove();
  }
});
