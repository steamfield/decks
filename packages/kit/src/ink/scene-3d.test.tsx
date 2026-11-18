import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { setup } from "../kit.test-support";
import { Scene3D } from "./scene-3d";

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "Scene3D renders the poster and creates no WebGL context in %s mode",
  async (mode) => {
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
    const image = screen.getByRole("img", { name: "Clay forms" });
    expect(within(image).getByText("Three clay forms")).toBeVisible();
    expect(image.querySelector("canvas")).toBeNull();
  },
);
