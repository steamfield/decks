import { readdirSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { site } from "../../config";
import { deckDir, loadExamples } from "../../data/examples";
import { MotionShowcase } from "./MotionShowcase";

it("keeps the displayed file until the deck reports the next slide on screen", async () => {
  const examples = loadExamples().filter((item) => item.name === site.motionShowcase.example);
  const [example] = examples;
  const slides = readdirSync(join(deckDir(site.motionShowcase.example), "slides"))
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .map((file) => `slides/${file}`);
  const [cover, carve] = slides;
  if (!example || !cover || !carve) throw new Error("Missing motion showcase slides");
  render(
    <MotionShowcase examples={examples}>
      {slides.map((file) => (
        <figure key={file} hidden={file !== cover}>
          <figcaption>{file}</figcaption>
        </figure>
      ))}
    </MotionShowcase>,
  );
  const frame = screen.getByTitle(`${example.title}, interactive deck`);
  if (!(frame instanceof HTMLIFrameElement)) throw new Error("Missing deck frame");
  const state = (slide: number, settled: boolean) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          source: frame.contentWindow,
          origin: window.location.origin,
          data: {
            type: "decks:state",
            slide,
            slides: example.slides,
            beat: 0,
            beats: example.states.find((s) => s.slide === slide)?.beats,
            settled,
            direction: null,
            lead: "",
            body: "",
          },
        }),
      );
    });
  state(1, true);
  await userEvent.click(screen.getByRole("button", { name: "Step forward" }));
  expect(within(screen.getByRole("figure")).getByText(cover)).toBeVisible();
  state(2, false);
  expect(within(screen.getByRole("figure")).getByText(cover)).toBeVisible();
  state(2, true);
  expect(within(screen.getByRole("figure")).getByText(carve)).toBeVisible();
  expect(within(screen.getByRole("figure")).queryByText(cover)).toBeNull();
});
