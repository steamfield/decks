import {
  DUR,
  type GrowHandle,
  InkCardRect,
  InkNumber,
  ink,
  SETTLE,
  StoryCard,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import styles from "./BusinessModelStage.module.css";

const BLOCK_X = 110;
const BLOCK_W = 770;
const BLOCK_H = 82;
const BLOCK_GAP = 20;
const BLOCK_TOP = 300;
const TIERS = [
  { name: "Open source", buyer: "Anyone", price: "free", paid: false },
  { name: "Pro", buyer: "Analysts and quants", price: "$19/mo", paid: true },
  { name: "Team", buyer: "Data teams", price: "$99/seat/mo · 5+ seats", paid: true },
  {
    name: "Private instance",
    buyer: "Regulated verticals",
    price: "from $50K/yr · roadmap",
    paid: true,
  },
];
const blocks = TIERS.map((tier, i) => ({
  ...tier,
  y: BLOCK_TOP + i * (BLOCK_H + BLOCK_GAP),
  color: tier.paid ? ink("emerald", 3) : ink("slate", 2),
}));
const LADDER_BOTTOM = BLOCK_TOP + TIERS.length * (BLOCK_H + BLOCK_GAP) + 4;
const COPY = [
  {
    lead: "Four tiers, three of them paid.",
    body: "The engine is open source. The API, the agent interface and the charts are what we sell.",
  },
  {
    lead: "AccuWeather makes $225M a year on free feeds.",
    body: "The National Weather Service data underneath it costs nothing to download.",
  },
  {
    lead: "GovWin charges $12K to $42K a seat.",
    body: "The bid notices underneath are public. Both companies charge for making free data usable.",
  },
];

export function BusinessModelStage() {
  const margin = useRef<GrowHandle>(null);
  const accu = useRef<GrowHandle>(null);
  const govwin = useRef<GrowHandle>(null);
  const s = useTween({ blocks: 0, foot: 0 });
  const { clicks, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { blocks: 1, duration: DUR.grow, ease: SETTLE });
      tl.to(s, { foot: 1, duration: DUR.card, ease: SETTLE }, `-=${DUR.opacity}`);
      margin.current?.addGrow(tl, "<");
    },
    beats: (tl, beat) => {
      beat(0);
      accu.current?.addGrow(tl, `+=${DUR.opacity}`);
      beat(1);
      govwin.current?.addGrow(tl, `+=${DUR.opacity}`);
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g key={playCount}>
          {blocks.map((block, i) => (
            <g key={block.name} style={{ color: block.color }}>
              <g style={{ opacity: Math.min(1, Math.max(0, s.blocks * 4 - i)) }}>
                <InkCardRect
                  x={BLOCK_X}
                  y={block.y}
                  width={BLOCK_W}
                  height={BLOCK_H}
                  glowR={0.8}
                  glowEdge={0.6}
                  strokeOpacity={0.75}
                  strokeWidth={2}
                  glowFilter={block.paid}
                />
                <text className={styles.name} x={BLOCK_X + 36} y={block.y + 38}>
                  {block.name}
                </text>
                <text className={styles.buyer} x={BLOCK_X + 36} y={block.y + 66}>
                  {block.buyer}
                </text>
                <text
                  className={styles.price}
                  x={BLOCK_X + BLOCK_W - 36}
                  y={block.y + 50}
                  textAnchor="end"
                  style={{ fill: block.color }}
                >
                  {block.price}
                </text>
              </g>
            </g>
          ))}
          <text
            className={styles.foot}
            x={BLOCK_X}
            y={LADDER_BOTTOM + 20}
            style={{ opacity: s.foot }}
          >
            target list prices, pre-revenue
          </text>
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">Companies already sell usable public data.</h2>
          <div className={styles.comps}>
            <InkNumber
              ref={accu}
              value="$225M"
              label="AccuWeather annual revenue, on free NWS feeds"
              hue="cyan"
              step={3}
              size={5.4}
            />
            <InkNumber
              ref={govwin}
              value="$12K to $42K"
              label="GovWin IQ, per seat per year, on free bid notices"
              hue="cyan"
              step={3}
              size={3.6}
            />
          </div>
          <div className={styles.margin}>
            <InkNumber
              ref={margin}
              value="~90%"
              label="modeled gross margin"
              hue="emerald"
              step={3}
            />
          </div>
        </>
      }
      card={<StoryCard anchor="right" hue="emerald" lead={copy.lead} body={copy.body} />}
    />
  );
}
