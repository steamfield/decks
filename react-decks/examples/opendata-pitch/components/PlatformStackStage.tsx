import { useSlide } from "@steamfield/decks";
import {
  clamp01,
  DRAW,
  DUR,
  InkCardRect,
  InkChip,
  ink,
  SETTLE,
  StoryCard,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { motionMode, useTween } from "@steamfield/decks/motion";
import { BASELINE_X } from "../data/baseline";
import styles from "./PlatformStackStage.module.css";

const BASE = { x: BASELINE_X[0], w: BASELINE_X[1] - BASELINE_X[0], h: 116 };
const SURFACE = { h: 164, gap: 40 };
const SURFACE_INSET = 14;
const ROW_W = BASE.w - SURFACE_INSET * 2;
const UNIT_W = (ROW_W - SURFACE.gap * 2) / 3.5;
const STEM = 52;
const STEP = 0.18;
const SLAB = { h: 76, gap: 20 };
const STACK_MID = 600;
const STACK_H = SURFACE.h + STEM + BASE.h + SLAB.gap + SLAB.h;
const SURFACE_Y = STACK_MID - STACK_H / 2;
const STEM_TOP = SURFACE_Y + SURFACE.h;
const BASE_Y = STEM_TOP + STEM;
const SLAB_Y = BASE_Y + BASE.h + SLAB.gap;
const SURFACES = [
  { id: "api", name: "API", who: "Developers build on it", wide: false },
  { id: "agents", name: "Agents", who: "MCP and Ask, no code needed", wide: true },
  { id: "charts", name: "Charts", who: "Editable, for articles and decks", wide: false },
];
let cursor = BASE.x + SURFACE_INSET;
const surfaces = SURFACES.map((surface) => {
  const w = surface.wide ? UNIT_W * 1.5 : UNIT_W;
  const x = cursor;
  cursor += w + SURFACE.gap;
  return { ...surface, x, w, cx: x + w / 2 };
});
const BASE_INK = ink("cyan", 3);
const SURFACE_INK = ink("emerald", 3);
const OUTLINE_INK = ink("slate", 1);
const PRIVATE_INK = ink("amber", 3);
const BASE_COPY = { name: "Catalog and graph", meta: "one query interface" };
const SLAB_COPY = { name: "Your data", meta: "on an enterprise’s own data" };
const COPY = [
  {
    lead: "One catalog, one graph, one interface.",
    body: "Everything we clean lands in one place, linked to everything like it, behind a single query layer.",
  },
  {
    lead: "Three ways in, for three kinds of user.",
    body: "Developers build on the API. Non-technical users ask an agent. Editors get charts they can edit.",
  },
  {
    lead: "The same stack runs on private data.",
    body: "Every enterprise conversation asks for it. It ships once signed demand covers the SOC 2 cost.",
  },
];
const CHIP_X = BASE.x + BASE.w - 28;
const CHIP_Y = SLAB_Y + 38;

export function PlatformStackStage() {
  const s = useTween({ frame: 0, surfaces: 0, slab: 0, chip: 0 });
  const { isActive, renderContext } = useSlide();
  const live = isActive && renderContext === "slide" && motionMode() === "live";
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: 1, duration: DUR.card, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { surfaces: 1, duration: DUR.scale, ease: DRAW }, `+=${DUR.opacity}`);
      beat(1);
      tl.to(s, { slab: 1, duration: DUR.grow, ease: SETTLE }, `+=${DUR.opacity}`);
      tl.to(s, { chip: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`);
      beat(2);
    },
  });
  const surfaceProgress = (i: number) => stagger(s.surfaces, i, SURFACES.length, STEP);
  const surfaceLit = (i: number) => surfaceProgress(i) >= 0.5;
  const slabIn = clamp01(s.slab);
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          <g
            style={{
              color: BASE_INK,
              opacity: s.frame,
              transform: `translate(0, ${(1 - s.frame) * 14}px)`,
            }}
          >
            <InkCardRect
              x={BASE.x}
              y={BASE_Y}
              width={BASE.w}
              height={BASE.h}
              glowR={0.8}
              glowEdge={0.6}
              strokeOpacity={0.75}
              strokeWidth={2}
              glowFilter
            />
            <text className={styles.name} x={BASE.x + 36} y={BASE_Y + 48}>
              {BASE_COPY.name}
            </text>
            <text className={styles.meta} x={BASE.x + 36} y={BASE_Y + 84}>
              {BASE_COPY.meta}
            </text>
          </g>
          {slabIn > 0 && (
            <g
              style={{
                color: PRIVATE_INK,
                opacity: slabIn,
                transform: `translate(0, ${(1 - slabIn) * -16}px)`,
              }}
            >
              <InkCardRect
                x={BASE.x}
                y={SLAB_Y}
                width={BASE.w}
                height={SLAB.h}
                glowR={0.8}
                glowEdge={0.6}
                strokeOpacity={0.75}
                strokeWidth={2}
                dash="10 10"
                glowFilter
              />
              <text className={styles.name} x={BASE.x + 36} y={SLAB_Y + 40}>
                {SLAB_COPY.name}
              </text>
              <text className={styles.meta} x={BASE.x + 36} y={SLAB_Y + 66}>
                {SLAB_COPY.meta}
              </text>
            </g>
          )}
          {surfaces.map((surface, i) => (
            <g
              key={surface.id}
              className={styles.surface}
              style={{
                color: surfaceLit(i) ? SURFACE_INK : OUTLINE_INK,
                opacity: s.frame,
                transform: `translate(0, ${(1 - s.frame) * 14}px)`,
                transition: live ? undefined : "none",
              }}
            >
              <line
                x1={surface.cx}
                x2={surface.cx}
                y1={STEM_TOP}
                y2={BASE_Y}
                stroke="currentColor"
                strokeOpacity={0.5}
                strokeWidth={2}
              />
              <InkCardRect
                x={surface.x}
                y={SURFACE_Y}
                width={surface.w}
                height={SURFACE.h}
                glowR={0.8}
                glowEdge={0.6}
                lit={surfaceLit(i)}
                strokeOpacity={surfaceLit(i) ? 0.75 : 0.4}
                strokeWidth={2}
                glowFilter={surfaceLit(i)}
              />
              <text
                className={styles.name}
                x={surface.x + 28}
                y={SURFACE_Y + 50}
                style={{ opacity: surfaceProgress(i) }}
              >
                {surface.name}
              </text>
              <foreignObject
                x={surface.x + 26}
                y={SURFACE_Y + 66}
                width={surface.w - 44}
                height={SURFACE.h - 74}
                style={{ opacity: surfaceProgress(i) }}
              >
                <div className={styles.who}>{surface.who}</div>
              </foreignObject>
            </g>
          ))}
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head is-wide">
            The catalog is the base. The tools are the product.
          </h2>
          <InkChip
            x={CHIP_X}
            y={CHIP_Y}
            anchor="right"
            hue="amber"
            text="Roadmap, not built yet"
            progress={s.chip}
          />
        </>
      }
      card={<StoryCard anchor="left" hue="emerald" lead={copy.lead} body={copy.body} />}
    />
  );
}
