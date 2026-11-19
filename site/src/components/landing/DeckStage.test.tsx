import { act, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, onTestFinished } from "vitest";
import type { Command } from "../../lib/player/protocol";
import type { StageController } from "../../lib/stage/controller";
import { DeckStage } from "./DeckStage";

const poster = { base: "/posters/agent-hero", width: 1920, height: 1080 };

/** The deck's window: happy-dom loads no iframe page, so it is a stand-in recording commands. */
function deck() {
  const sent: Command[] = [];
  const win = { postMessage: (message: Command) => sent.push(message) };
  const frame = document.querySelector("iframe");
  if (!frame) throw new Error("DeckStage rendered no iframe");
  Object.defineProperty(frame, "contentWindow", { value: win, configurable: true });
  const say = (data: unknown) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data,
          origin: window.location.origin,
          source: win as unknown as Window,
        }),
      );
    });
  return { element: frame, sent, say };
}

const settledState = (requestId?: number) => ({
  type: "decks:state",
  ...(requestId === undefined ? {} : { requestId }),
  slide: 4,
  slides: 9,
  beat: 0,
  beats: 0,
  settled: true,
  direction: null,
});

/** The server's HTML for `element`, in the document until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

function mount() {
  const controllers: (StageController | null)[] = [];
  const props = {
    src: "/d/agent-hero/index.html",
    poster,
    label: "A blank deck, before the agent starts",
    initialHash: "/1",
    onController: (controller: StageController | null) => controllers.push(controller),
  };
  const view = render(<DeckStage {...props} />);
  // The stand-in window goes in before any command is sent.
  return { ...view, props, controllers, deck: deck() };
}

describe("DeckStage", () => {
  it("renders only the labelled slide canvas, with the poster in front of the hidden frame", () => {
    const { container, deck: d } = mount();
    const stage = screen.getByRole("img", { name: "A blank deck, before the agent starts" });
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(stage);
    expect(screen.queryAllByRole("button")).toEqual([]);
    expect(screen.queryAllByRole("status")).toEqual([]);
    expect(stage).toHaveTextContent("");
    expect(d.element).toHaveAttribute("src", "/d/agent-hero/index.html?decks-bridge=1#/1");
    expect(d.element).toHaveAttribute("aria-hidden", "true");
    expect(d.element).toHaveAttribute("tabindex", "-1");
    expect(d.element).toHaveAttribute("inert");
    expect(d.element).toHaveStyle({ visibility: "hidden" });
    const image = stage.querySelector("picture img");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("src", "/posters/agent-hero-1920.webp");
  });

  it("keeps the poster through ready and swaps to the frame when the first command settles", async () => {
    const { controllers, deck: d } = mount();
    const [stage] = controllers;
    if (!stage) throw new Error("DeckStage handed over no controller");
    d.say({ type: "decks:ready" });
    d.say(settledState());
    expect(document.querySelector("picture")).not.toBeNull();
    expect(d.element).toHaveStyle({ visibility: "hidden" });

    let result: unknown;
    const shown = stage.show(4, 0).then((value) => {
      result = value;
    });
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "show", slide: 4, beat: 0, requestId: 1 }]);
    d.say(settledState(1));
    await act(() => shown);
    expect(result).toMatchObject({ cancelled: false, state: { slide: 4 } });
    expect(document.querySelector("picture")).toBeNull();
    expect(d.element).toHaveStyle({ visibility: "visible" });
  });

  it("sends nothing and keeps its controller when re-rendered with equal props", () => {
    const { rerender, props, controllers, deck: d } = mount();
    d.say({ type: "decks:ready" });
    rerender(<DeckStage {...props} onController={(controller) => controllers.push(controller)} />);
    expect(controllers).toHaveLength(1);
    expect(d.sent).toEqual([]);
  });

  it("server-renders the poster alone, the same image the browser keeps, with no frame", () => {
    const host = serverHtml(
      <DeckStage
        src="/d/agent-hero/index.html"
        poster={poster}
        label="A blank deck, before the agent starts"
      />,
    );
    expect(host.querySelector("iframe")).toBeNull();
    const image = within(host)
      .getByRole("img", { name: "A blank deck, before the agent starts" })
      .querySelector("img");
    expect(image).toHaveAttribute("src", "/posters/agent-hero-1920.webp");
  });

  it("names itself by the motion preference and offers the reduced poster to the browser", () => {
    const host = serverHtml(
      <DeckStage
        src="/d/agent-hero/index.html"
        poster={poster}
        reducedPoster={{ ...poster, base: "/posters/agent-hero-finished" }}
        label="A blank deck"
        reducedLabel="The finished deck"
      />,
    );
    // happy-dom has no media queries, so both names are present; landing.css hides one.
    const stage = within(host).getByRole("img", { name: "A blank deck The finished deck" });
    const sources = [...stage.querySelectorAll("source")].map((source) => [
      source.getAttribute("media"),
      source.getAttribute("srcset")?.split(", ").at(-1),
    ]);
    expect(sources).toEqual([
      ["(prefers-reduced-motion: reduce)", "/posters/agent-hero-finished-1920.avif 1920w"],
      ["(prefers-reduced-motion: reduce)", "/posters/agent-hero-finished-1920.webp 1920w"],
      [null, "/posters/agent-hero-1920.avif 1920w"],
      [null, "/posters/agent-hero-1920.webp 1920w"],
    ]);
  });

  it("when made still, disposes its controller, hands over null and shows the poster again", async () => {
    const { container, rerender, props, controllers, deck: d } = mount();
    const [stage] = controllers;
    if (!stage) throw new Error("DeckStage handed over no controller");
    d.say({ type: "decks:ready" });
    const shown = stage.show(4, 0);
    d.say(settledState(1));
    await act(() => shown);
    expect(container.querySelector("picture")).toBeNull();
    rerender(<DeckStage {...props} still />);
    expect(controllers).toEqual([stage, null]);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("picture img")).not.toBeNull();
    await expect(stage.show(5, 0)).rejects.toThrow("disposed");
  });
});
