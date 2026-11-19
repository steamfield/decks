/**
 * The click counter in `node` reads `MOTION_TEMPLATE_BEATS` from `core` to know how many clicks
 * each template takes. These tests render every template and check its last beat lands on the
 * click that table predicts, so the table and the templates cannot drift apart.
 */
import { MOTION_TEMPLATE_BEATS, MOTION_TEMPLATE_NAMES } from "@react-decks/core";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { MotionTemplateName, TemplateProps } from "./motion-template-props";

const fixtures: { readonly [Name in MotionTemplateName]: TemplateProps<Name> } = {
  agenda: { template: "agenda", items: ["Field notes", "Handoff gaps", "Trial run"], current: 2 },
  "comparison-split": {
    template: "comparison-split",
    left: { title: "Paper tickets", points: ["Queue at the kiosk.", "Keep the stub."] },
    right: { title: "Mobile passes", points: ["Book from home.", "Scan at the gate."] },
  },
  "device-mockup": {
    template: "device-mockup",
    src: "/trail-desk.svg",
    alt: "Trail Desk showing the lake and ridge patrols",
    caption: "Both crews can read the handoff before they leave.",
    device: "laptop",
  },
  "end-card": { template: "end-card", title: "Take the checklist to your next shift." },
  "icon-array": { template: "icon-array", total: 4, filled: 2, label: "Two of four reviewers" },
  "list-cascade": {
    template: "list-cascade",
    items: ["Read the field notes", "Trace the missed handoff", "Try the revised checklist"],
  },
  "logo-reveal": {
    template: "logo-reveal",
    src: "/inlet-press.svg",
    alt: "Inlet Press wordmark",
    tagline: "Field guides for the long way home.",
  },
  "lower-third": { template: "lower-third", name: "Mira Chen", role: "Harbour pilot" },
  "metric-grid": {
    template: "metric-grid",
    metrics: [
      { value: 42, label: "Crossings" },
      { value: 7, label: "Delays" },
    ],
  },
  "myth-fact": {
    template: "myth-fact",
    myth: "The tide sets the departure time.",
    fact: "The ramp adjusts to the tide.",
  },
  "photo-reveal": {
    template: "photo-reveal",
    src: "/north-inlet.svg",
    alt: "Pine silhouettes above the water",
    caption: "Fog rolls through North Inlet.",
  },
  "process-flow": {
    template: "process-flow",
    steps: ["Scan the boarding pass.", "Assign a berth.", "Release the gangway."],
  },
  "quote-card": {
    template: "quote-card",
    quote: "One missed handoff can hold up the whole crew.",
    source: "Shift supervisor",
  },
  "section-wipe": { template: "section-wipe", number: "02", title: "Where the handoff breaks" },
  spotlight: {
    template: "spotlight",
    src: "/field.svg",
    alt: "Six paths meeting at a buoy",
    x: 0.54,
    y: 0.5,
    label: "Harbour entrance",
  },
  "stat-burst": { template: "stat-burst", value: 38, suffix: "%", label: "Faster boarding" },
  "stat-compare": { template: "stat-compare", from: 12, to: 9, label: "Minutes at the ramp" },
  "team-grid": {
    template: "team-grid",
    people: [
      { name: "Ada Reed", role: "Design lead" },
      { name: "Li Wu", role: "Field engineer" },
    ],
  },
  "timeline-sweep": {
    template: "timeline-sweep",
    events: [
      { date: "April", label: "Dock trials begin." },
      { date: "June", label: "Passenger service opens." },
      { date: "July", label: "The evening route opens." },
    ],
  },
  "title-reveal": {
    template: "title-reveal",
    title: "The ferry handoff",
    subtitle: "A field study",
  },
  "venn-overlap": {
    template: "venn-overlap",
    sets: ["Workshop", "Field crew", "Design"],
    overlap: "Pilot",
  },
  "word-swap": { template: "word-swap", lead: ["We ship"], words: ["quarterly", "weekly"] },
  "bar-board": {
    template: "bar-board",
    rows: [
      { label: "North", value: 42 },
      { label: "South", value: 17 },
    ],
    source: "Harbour log",
  },
  "command-line": { template: "command-line", command: "bun add @steamfield/decks" },
  "scramble-text": { template: "scramble-text", text: "Decoded", label: "Status" },
  "donut-build": {
    template: "donut-build",
    segments: [
      { label: "Mobile", value: 58 },
      { label: "Desktop", value: 42 },
    ],
    suffix: "%",
  },
};

/** How many clicks the table says a template's beats take, for the fixture's props. */
function predictedBeats(name: (typeof MOTION_TEMPLATE_NAMES)[number]): number {
  const rule = MOTION_TEMPLATE_BEATS[name];
  if (rule.kind === "one") return 1;
  if (rule.kind === "two") return 2;
  const list = Object.entries(fixtures[name]).find(([prop]) => prop === rule.prop)?.[1];
  if (!Array.isArray(list)) throw new Error(`${name} fixture has no ${rule.prop} list`);
  return list.length;
}

/** What a viewer sees of the template: each text or image with its effective opacity. */
function pose(): string[] {
  const region = screen.getByRole("region", { name: "Template" });
  return Array.from(region.querySelectorAll("*")).flatMap((element) => {
    const text = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.nodeValue ?? "")
      .join("")
      .trim();
    const label = text || element.getAttribute("alt") || "";
    if (!label) return [];
    let opacity = 1;
    let hidden = false;
    for (let part: Element | null = element; part && part !== region; part = part.parentElement) {
      const style = getComputedStyle(part);
      opacity *= Number(style.opacity || 1);
      hidden ||= style.visibility === "hidden" || style.display === "none";
    }
    return [`${label}: ${hidden ? 0 : opacity}`];
  });
}

beforeEach(() => installTheme(resolveTheme()));

it("the beat table names exactly the templates MotionTemplate renders", () => {
  expect([...MOTION_TEMPLATE_NAMES].sort()).toEqual(Object.keys(fixtures).sort());
});

it.each(MOTION_TEMPLATE_NAMES)(
  "%s plays its last beat on the click the beat table predicts",
  async (name) => {
    // Place the last beat on click 2, so clicks 1 and 3 sit either side within the slide's 3.
    const at = 3 - predictedBeats(name);
    const view = await setup(
      () => (
        <section aria-label="Template">
          <MotionTemplate {...fixtures[name]} at={at} />
        </section>
      ),
      { click: 1, instant: true },
    );
    // jsdom never loads images, and the image templates reveal only once theirs has.
    for (const image of screen.queryAllByRole("img", { hidden: true })) {
      if (!(image instanceof HTMLImageElement)) continue;
      Object.defineProperties(image, {
        naturalWidth: { value: 640 },
        naturalHeight: { value: 480 },
      });
      fireEvent.load(image);
    }
    const before = pose();
    await view.next();
    const last = pose();
    await view.next();
    expect(last).not.toEqual(before);
    expect(pose()).toEqual(last);
  },
);
