import { act, screen, within } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { setup } from "../kit.test-support";
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

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "Scene3D renders the poster and creates no WebGL context in %s mode",
  async (mode) => {
    const requested = recordContextRequests();
    await setup(
      () => (
        <Scene3D
          label="Clay forms"
          poster={<span>Three clay forms</span>}
          setup={(_scene, _tl, beat) => beat(0)}
        />
      ),
      {
        context: mode === "instant" ? "slide" : mode,
        instant: mode === "instant",
      },
    );
    // The live branch asks for a context only once three has loaded; let any such load finish.
    await act(async () => {
      await import("three");
    });
    const image = screen.getByRole("img", { name: "Clay forms" });
    expect(within(image).getByText("Three clay forms")).toBeVisible();
    expect(image.querySelector("canvas")).toBeNull();
    expect(requested.filter((kind) => kind.startsWith("webgl"))).toEqual([]);
  },
);
