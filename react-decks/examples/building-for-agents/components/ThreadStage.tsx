import { DUR, SETTLE, StoryCard, StoryStage, stagger, TRACE, useStage } from "@react-decks/kit";
import { useTween } from "@react-decks/motion";
import {
  countWord,
  FEATURED,
  langLines,
  OPENDATA_TESTS,
  TYPESCRIPT_PRODUCTS,
} from "../data/03-thread";
import { PRODUCTS, product } from "../data/products";
import { DIM, FRAME, OFF, ON } from "./design";
import { EvidenceTag } from "./EvidenceTag";
import { PixelIcon } from "./PixelIcon";
import { ThreadRail } from "./ThreadRail";

const featuredNames = FEATURED.map((id) => product(id).name);
const COPY = [
  {
    lead: "I built each tool for my own work.",
    body: `Most started inside OpenData, whose test suite is about ${OPENDATA_TESTS.toLocaleString("en-US")} tests.`,
  },
  {
    lead: `${countWord(TYPESCRIPT_PRODUCTS)} of the ${countWord(PRODUCTS.length).toLowerCase()} use TypeScript.`,
    body: "rr is Go. StatGlass samples the system in Rust, and OpenData’s engine is Python.",
  },
  {
    lead: `${countWord(FEATURED.length)} get several slides tonight.`,
    body: `${featuredNames.slice(0, -1).join(", ")} and ${featuredNames.at(-1)}, with the source code on screen.`,
  },
];

const ROAD_Y = 424;
const TILE = 116;
const ICON = 76;
const SPAN = (FRAME.right - FRAME.left) / PRODUCTS.length;
const VERB_Y = ROAD_Y + TILE / 2 + 40;
const NAME_Y = VERB_Y + 46;
const LANG_Y = NAME_Y + 36;
const LANG_GAP = 24;

const stations = PRODUCTS.map((p, i) => ({
  ...p,
  x: FRAME.left + (i + 0.5) * SPAN,
  lang: langLines(p.lang),
  featured: FEATURED.includes(p.id),
}));
const first = stations[0];
const last = stations.at(-1);
if (!first || !last) throw new Error("ThreadStage: no product stations");
const links = [
  { x1: FRAME.left, x2: first.x - TILE / 2 },
  ...stations.slice(1).map((st, i) => {
    const previous = stations[i];
    if (!previous) throw new Error(`ThreadStage: missing station ${i}`);
    return { x1: previous.x + TILE / 2, x2: st.x - TILE / 2 };
  }),
  { x1: last.x + TILE / 2, x2: FRAME.right },
];

export function ThreadStage() {
  const s = useTween({ road: OFF, tiles: OFF, names: OFF, focus: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { road: ON, duration: DUR.scale, ease: TRACE });
      tl.to(s, { tiles: ON, duration: DUR.scale, ease: SETTLE }, `-=${DUR.grow}`);
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { names: ON, duration: DUR.scale, ease: "none" });
      beat(1);
      tl.to(s, { focus: ON, duration: DUR.color, ease: SETTLE });
      beat(2);
    },
  });
  const linkProgress = (i: number) => stagger(s.road, i, links.length, 0.1);
  const tileProgress = (i: number) => stagger(s.tiles, i, stations.length, 0.1);
  const nameProgress = (i: number) => stagger(s.names, i, stations.length, 0.1);
  const level = (featured: boolean) => (featured ? ON : ON - s.focus * (ON - DIM));
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          {links.map((link, i) => (
            <line
              key={link.x1}
              className="sf-wire"
              x1={link.x1}
              x2={link.x1 + (link.x2 - link.x1) * linkProgress(i)}
              y1={ROAD_Y}
              y2={ROAD_Y}
              style={{ opacity: linkProgress(i) > OFF ? ON - s.focus * (ON - DIM) : OFF }}
            />
          ))}
          {stations.map((st, i) => (
            <g key={st.id} style={{ opacity: level(st.featured) }}>
              <g
                style={{
                  opacity: tileProgress(i),
                  transform: `translate(0, ${(ON - tileProgress(i)) * 14}px)`,
                }}
              >
                <rect
                  className="sf-box is-well"
                  x={st.x - TILE / 2}
                  y={ROAD_Y - TILE / 2}
                  width={TILE}
                  height={TILE}
                />
                <PixelIcon
                  id={st.id}
                  x={st.x - ICON / 2}
                  y={ROAD_Y - ICON / 2}
                  width={ICON}
                  height={ICON}
                />
                <text className="sf-pixel" x={st.x} y={VERB_Y} textAnchor="middle">
                  {st.verb}
                </text>
              </g>
              <g
                style={{
                  opacity: nameProgress(i),
                  transform: `translate(0, ${(ON - nameProgress(i)) * 10}px)`,
                }}
              >
                <text className="sf-name" x={st.x} y={NAME_Y} textAnchor="middle">
                  {st.name}
                </text>
                {st.lang.map((line, n) => (
                  <text
                    key={line}
                    className="sf-mono is-small"
                    x={st.x}
                    y={LANG_Y + n * LANG_GAP}
                    textAnchor="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>
            </g>
          ))}
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">I ship a change with seven tools I built.</h2>
          <EvidenceTag
            kind="schematic"
            x={FRAME.right}
            y={ROAD_Y - TILE / 2 - 86}
            align="right"
            progress={s.tiles}
          />
          <ThreadRail />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
