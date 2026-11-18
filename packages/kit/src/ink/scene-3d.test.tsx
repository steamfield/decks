import { mountDeck, type RenderContext, SlideHost, useSlide } from "@react-decks/runtime";
import { act, screen, within } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { Scene3D } from "./scene-3d";

/** jsdom returns null for every WebGL context, so record the requests instead of reading them. */
function recordContextRequests(): string[] {
  const requested: string[] = [];
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    requested.push(kind);
    return null;
  } as typeof original;
  onTestFinished(() => {
    HTMLCanvasElement.prototype.getContext = original;
  });
  return requested;
}

function Scene({ context }: { context: RenderContext }) {
  const slide = useSlide();
  if (slide.renderContext === "slide" && context !== "slide")
    return <SlideHost no={1} clicks={slide.clicks} context={context} />;
  return (
    <Scene3D
      label="Clay forms"
      poster={<span>Three clay forms</span>}
      setup={(_scene, _tl, beat) => beat(0)}
    />
  );
}

/** mountDeck rather than the kit's setup, because only mountDeck publishes `window.__deck`. */
async function show(context: RenderContext, instant: boolean) {
  window.history.replaceState(null, "", `/${instant ? "?motion=instant" : ""}#/1`);
  const root = document.createElement("div");
  document.body.append(root);
  let unmount = () => {};
  onTestFinished(async () => {
    await act(async () => unmount());
    root.remove();
    window.history.replaceState(null, "", "/");
  });
  await act(async () => {
    unmount = mountDeck(
      {
        manifest: {
          name: "scene-3d",
          title: "Scene",
          canvas: { width: 1920, height: 1080 },
          slides: [{ no: 1, id: "scene", file: "scene.mdx", title: "Scene", clicks: 0 }],
        },
        slides: { scene: async () => ({ default: () => <Scene context={context} /> }) },
        frontmatter: {},
        components: {},
      },
      root,
    );
  });
  return screen.findByRole("img", { name: "Clay forms" });
}

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "Scene3D renders the poster and creates no WebGL context in %s mode",
  async (mode) => {
    const requested = recordContextRequests();
    const image = await show(mode === "instant" ? "slide" : mode, mode === "instant");
    // A live Scene3D holds settled() until three has loaded and its scene has asked for a
    // context, so once the deck settles any such request has been recorded.
    await act(async () => {
      if (!window.__deck) throw new Error("Deck did not mount");
      await window.__deck.settled();
    });
    expect(within(image).getByText("Three clay forms")).toBeVisible();
    expect(image.querySelector("canvas")).toBeNull();
    expect(requested.filter((kind) => kind.startsWith("webgl"))).toEqual([]);
  },
);
