import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeSource, setup } from "./deck.test-support";
import { SlideFrame, useSlideScale } from "./index";

function Scale() {
  return <p>Canvas scale {useSlideScale()}</p>;
}
function FramedSlide() {
  return (
    <SlideFrame>
      <Scale />
    </SlideFrame>
  );
}

it("without ResizeObserver a frame has design dimensions and scale one and only main owns the id", async () => {
  const source = makeSource();
  const { container } = setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": async () => ({ default: FramedSlide }) },
  });
  const scale = await screen.findByText("Canvas scale 1");
  const main = container.querySelector("#deck-frame");
  expect(container.querySelectorAll("#deck-frame")).toHaveLength(1);
  for (const frame of [main, scale.parentElement]) {
    if (!(frame instanceof HTMLElement)) throw new Error("Missing frame");
    const style = window.getComputedStyle(frame);
    expect(style.width).toBe("1920px");
    expect(style.height).toBe("1080px");
    expect(style.transform).toBe("scale(1)");
    expect(style.transformOrigin).toBe("left top");
    expect(style.containerType).toBe("size");
    expect(style.getPropertyValue("--deck-w")).toBe("1920");
    expect(style.getPropertyValue("--deck-h")).toBe("1080");
    expect(style.getPropertyValue("--deck-scale")).toBe("1");
    expect(style.getPropertyValue("--deck-text-scale")).toBe("1");
  }
  expect(scale.parentElement).not.toHaveAttribute("id");
});
