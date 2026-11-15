import { expect, it } from "vitest";
import { FILTER_IDS, filterUrl, StoryStage } from "../index";
import { setup } from "../kit.test-support";

it("resolves exported filter tokens through the stage's inherited instance variables", () => {
  for (const [name, id] of Object.entries(FILTER_IDS))
    expect(filterUrl(id)).toBe(`var(--od-filter-${name})`);
  expect(filterUrl("own-id")).toBe("url(#own-id)");
});

function Stages() {
  return (
    <>
      <StoryStage />
      <StoryStage />
    </>
  );
}

it("renders one definition per filter token with fixed grain and displacement", async () => {
  const view = await setup(Stages, { instant: true });
  const defs = view.container.querySelector("defs");
  expect(defs?.querySelectorAll("filter")).toHaveLength(Object.keys(FILTER_IDS).length);
  for (const id of Object.values(FILTER_IDS))
    expect(defs?.querySelectorAll(`[id$="-${id}"]`)).toHaveLength(1);
  for (const [id, dryness, displacement, seed] of [
    [FILTER_IDS.rule, "-0.12", "0.6", "3"],
    [FILTER_IDS.marker, "-0.3", "2.6", "7"],
    [FILTER_IDS.dry, "-0.55", "1.8", "11"],
  ]) {
    const filter = defs?.querySelector(`[id$="-${id}"]`);
    expect(filter?.querySelector("feComposite")?.getAttribute("k3")).toBe(dryness);
    expect(filter?.querySelector("feDisplacementMap")?.getAttribute("scale")).toBe(displacement);
    expect(filter?.querySelector("feTurbulence")?.getAttribute("seed")).toBe(seed);
  }
  for (const id of [FILTER_IDS.ruleLite, FILTER_IDS.markerLite, FILTER_IDS.dryLite])
    expect(defs?.querySelector(`[id$="-${id}"] feDisplacementMap`)).toBeNull();
  expect(filterUrl("own-id")).toBe("url(#own-id)");
});

it("gives simultaneous stages separate ids and points their inherited filter URLs at their own defs", async () => {
  const view = await setup(Stages, { instant: true });
  const ids = Array.from(view.container.querySelectorAll("filter"), (element) => element.id);
  expect(ids).toHaveLength(2 * Object.keys(FILTER_IDS).length);
  expect(new Set(ids).size).toBe(ids.length);
  const stages = view.container.querySelectorAll<HTMLElement>(".od-slide");
  expect(stages).toHaveLength(2);
  for (const stage of stages) {
    const id = stage.querySelector('[id$="-mk-glow"]')?.id;
    if (!id) throw new Error("Missing stage glow");
    expect(stage.style.getPropertyValue("--od-filter-glow")).toBe(filterUrl(id));
  }
});
