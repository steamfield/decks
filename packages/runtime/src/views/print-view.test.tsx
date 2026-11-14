import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeSource, setup } from "../deck.test-support";
import { useSlide } from "../index";

function PrintStatus() {
  const slide = useSlide();
  return (
    <p role="status">{`${slide.no}:${slide.clicks}:${slide.renderContext}:${slide.isActive}`}</p>
  );
}

it("prints every click in slide order using static print contexts", async () => {
  const source = makeSource();
  const { container } = setup("#/print", {
    ...source,
    slides: Object.fromEntries(
      source.manifest.slides.map(({ id }) => [id, async () => ({ default: PrintStatus })]),
    ),
  });
  await screen.findByText("5:0:print:false");
  expect(document.documentElement).toHaveAttribute("data-deck-view", "print");
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "instant");
  const frames = [...container.querySelectorAll("[data-deck-slide]")];
  expect(frames.map((frame) => frame.getAttribute("data-deck-slide"))).toEqual([
    "1",
    "2",
    "2",
    "2",
    "2",
    "3",
    "4",
    "4",
    "5",
  ]);
  expect(screen.getAllByRole("status").map((frame) => frame.textContent)).toEqual([
    "1:0:print:false",
    "2:0:print:false",
    "2:1:print:false",
    "2:2:print:false",
    "2:3:print:false",
    "3:0:print:false",
    "4:0:print:false",
    "4:1:print:false",
    "5:0:print:false",
  ]);
});

it("prints only each slide's final click when print=final is in the page query", async () => {
  const source = makeSource();
  const { container } = setup("?print=final#/print", {
    ...source,
    slides: Object.fromEntries(
      source.manifest.slides.map(({ id }) => [id, async () => ({ default: PrintStatus })]),
    ),
  });
  await screen.findByText("5:0:print:false");
  expect(container.querySelectorAll("[data-deck-slide]")).toHaveLength(5);
  expect(within(container).getByText("2:3:print:false")).toBeVisible();
  expect(within(container).getByText("4:1:print:false")).toBeVisible();
  expect(screen.queryByText("2:0:print:false")).not.toBeInTheDocument();
});
