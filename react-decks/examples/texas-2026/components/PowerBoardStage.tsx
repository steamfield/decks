import {
  DRAW,
  DUR,
  easedStagger,
  InkPing,
  SETTLE,
  StoryCard,
  StoryLayer,
  StoryLink,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  boardLabels,
  certification,
  electionSource,
  evidenceLabels,
  house,
  sboe,
  senate,
  statewideOffices,
} from "../data/02-power-board";
import { BallotOval } from "./BallotOval";
import { BOARD, changed, DASH, DIM, FRAME, neutral, OFF, ON, OVAL } from "./design";
import styles from "./PowerBoardStage.module.css";

const G = { x: 832, width: FRAME.right - 832, height: 88, groupHeight: 128 };
const TAG = { width: 180, height: 42 };
const TILES = [
  {
    ...statewideOffices[0],
    x: G.x,
    y: BOARD.power.top,
    width: G.width,
    height: G.height,
    group: false,
  },
  {
    ...statewideOffices[1],
    x: BOARD.power.left,
    y: BOARD.power.top,
    width: BOARD.power.leftWidth,
    height: G.groupHeight,
    group: true,
  },
  {
    ...statewideOffices[2],
    x: BOARD.power.left,
    y: BOARD.power.middle,
    width: BOARD.power.leftWidth,
    height: G.groupHeight,
    group: true,
  },
  {
    ...statewideOffices[3],
    x: BOARD.power.left,
    y: BOARD.power.bottom,
    width: BOARD.power.leftWidth,
    height: G.groupHeight,
    group: true,
  },
  {
    ...house,
    name: `${house.democratic} Democratic, ${house.republican} Republican`,
    x: G.x,
    y: BOARD.power.middle,
    width: G.width,
    height: G.groupHeight,
    group: false,
  },
  {
    ...senate,
    name: `${senate.republican} Republican, ${senate.democratic} Democratic`,
    x: G.x,
    y: 720,
    width: G.width,
    height: G.height,
    group: false,
  },
  {
    ...sboe,
    name: `${sboe.democratic} Democratic, ${sboe.republican} Republican`,
    x: G.x,
    y: BOARD.power.bottom,
    width: G.width,
    height: BOARD.power.pendingHeight,
    group: false,
  },
];
const shared = (i: number) => i === 0 || i === 5;
const COPY = [
  {
    lead: `Democrats won ${statewideOffices.length} statewide offices.`,
    body: "The winners have yet to take office.",
  },
  { lead: "Democrats won a House majority.", body: "The final House seat count is pending." },
  {
    lead: "Republicans kept the Senate.",
    body: `${senate.republican} Republican and ${senate.democratic} Democratic seats are expected next session.`,
  },
  {
    lead: `The education-board majority depends on District ${sboe.district}.`,
    body: `A Democratic win there would give the party ${sboe.democratic} seats. A recount is possible.`,
  },
];
const descriptions = [
  `${statewideOffices.map((office) => `${office.name}, ${office.party}, won ${office.office}`).join(". ")}. ${certification.label}.`,
  `${house.office}: projected ${house.democratic} Democratic and ${house.republican} Republican seats. ${evidenceLabels.pending}.`,
  `${senate.office}: ${senate.republican} Republican and ${senate.democratic} Democratic seats expected next session.`,
  `${sboe.office}: ${sboe.democratic} Democratic and ${sboe.republican} Republican seats projected. ${evidenceLabels.pending}. District ${sboe.district}: ${sboe.recount}.`,
];

export function PowerBoardStage() {
  const tiles = [
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
    useTween({ fill: OFF, emphasis: ON }),
  ];
  const tileAt = (i: number) => {
    const value = tiles[i];
    if (!value) throw new Error(`PowerBoardStage has no state for tile ${i}`);
    return value;
  };
  const s = useTween({ senate: OFF, pending: OFF, ping: OFF });
  const color = (i: number) =>
    i === 5
      ? neutral(3)
      : `color-mix(in srgb, ${changed()} ${tileAt(i).fill * 100}%, ${neutral(2)})`;
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      statewideOffices.forEach((_, i) => {
        tl.to(
          tileAt(i),
          { fill: ON, duration: DUR.color, ease: DRAW },
          easedStagger(i, statewideOffices.length, DUR.grow),
        );
      });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(tiles.slice(0, statewideOffices.length), {
        emphasis: DIM,
        duration: DUR.opacity,
        ease: SETTLE,
      });
      tl.to(tileAt(4), { fill: ON, duration: DUR.color, ease: DRAW }, "<");
      beat(1);
      tl.to(tileAt(4), { emphasis: DIM, duration: DUR.opacity, ease: SETTLE });
      tl.to(s, { senate: ON, ping: ON, duration: DUR.grow, ease: DRAW }, "<");
      beat(2);
      tl.to(tileAt(5), { emphasis: DIM, duration: DUR.opacity, ease: SETTLE });
      tl.to(tileAt(6), { fill: ON, duration: DUR.color, ease: DRAW }, "<");
      tl.to(s, { pending: ON, duration: DUR.color, ease: SETTLE }, "<");
      beat(3);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">
            Democrats won {statewideOffices.length} statewide offices and the House.
          </h2>
          <p className={styles.description}>{descriptions[clicks]}</p>
          <div className="tx-baseline" />
          {[false, true].map((morph) => (
            <StoryLayer key={String(morph)} className={morph ? "vt-power-board" : undefined}>
              {TILES.map(
                (tile, i) =>
                  shared(i) === morph && (
                    <g
                      key={tile.office}
                      data-office={tile.office}
                      style={{ opacity: tileAt(i).emphasis }}
                    >
                      <rect
                        className={`tx-office-box ${styles.tile}`}
                        x={tile.x}
                        y={tile.y}
                        width={tile.width}
                        height={tile.height}
                        style={{ stroke: color(i) }}
                        strokeDasharray={i === 6 ? DASH : undefined}
                      />
                      <BallotOval
                        cx={tile.x + BOARD.pad + OVAL.rx}
                        cy={tile.y + G.height / 2}
                        state="filled"
                        meaning={i === 5 || tileAt(i).fill === OFF ? "neutral" : "changed"}
                        fill={i === 5 ? s.senate : tileAt(i).fill}
                        pending={i === 6}
                      />
                      <text
                        className={
                          tile.group || i === 6 ? `od-stage-note ${styles.office}` : "od-stage-name"
                        }
                        x={tile.x + 124}
                        y={tile.y + 33}
                      >
                        {tile.office}
                      </text>
                      <text
                        className={
                          tile.group || i === 6 ? "od-stage-note" : `od-stage-name ${styles.holder}`
                        }
                        x={tile.x + (tile.group || i === 6 ? 124 : 400)}
                        y={tile.y + (tile.group || i === 6 ? 64 : 33)}
                      >
                        {tile.name}
                      </text>
                      {i < statewideOffices.length && (
                        <text
                          className="od-stage-note"
                          x={tile.x + (tile.group ? 124 : 400)}
                          y={tile.y + (tile.group ? 100 : 64)}
                        >
                          {tile.party}
                        </text>
                      )}
                      {(i === 4 || i === 6) && (
                        <foreignObject
                          x={tile.x + tile.width - BOARD.pad - TAG.width}
                          y={tile.y + (G.height - TAG.height) / 2}
                          width={TAG.width}
                          height={TAG.height}
                        >
                          <div className={styles.tagSlot}>
                            <span className={`tx-tag is-pending ${styles.tag}`}>
                              {evidenceLabels.pending}
                            </span>
                          </div>
                        </foreignObject>
                      )}
                      {i === 6 && (
                        <text
                          className={`od-stage-note ${styles.resultNote}`}
                          x={tile.x + 124}
                          y={tile.y + 108}
                          style={{ opacity: s.pending }}
                        >{`District ${sboe.district}: possible recount`}</text>
                      )}
                    </g>
                  ),
              )}
              {morph && (
                <InkPing
                  x={G.x + BOARD.pad + OVAL.rx}
                  y={720 + G.height / 2}
                  r={OVAL.rx}
                  hue="slate"
                  progress={s.ping}
                />
              )}
            </StoryLayer>
          ))}
          <StoryLink
            href={
              [
                electionSource,
                boardLabels.houseSource,
                boardLabels.senateSource,
                boardLabels.educationSource,
              ][clicks] ?? electionSource
            }
            label={clicks ? boardLabels.reportingSource : boardLabels.officialSource}
          />
        </>
      }
      card={<StoryCard anchor="left" lead={copy.lead} body={copy.body} />}
    />
  );
}
