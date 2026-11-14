import {
  DRAW,
  DUR,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  boardOfManagers,
  commissioner,
  interventionSource,
  rulebookLabels as labels,
  rulebook,
  rulebookSource,
} from "../data/04-rulebook";
import { BOARD, DIM, neutral, OFF, ON } from "./design";
import styles from "./RulebookStage.module.css";

const G = {
  x: 848,
  right: 1808,
  width: 960,
  height: 96,
  branchWidth: 440,
  lawY: 280,
  appointmentY: 448,
  agencyY: 648,
  boardY: 860,
};
const COPY = [
  {
    lead: "The Legislature writes school law.",
    body: "The House and Senate also decide state school funding.",
  },
  {
    lead: "The governor appoints the education commissioner.",
    body: "The Senate must confirm the appointment.",
  },
  {
    lead: "The commissioner decides how the state intervenes.",
    body: "State law sets the conditions for replacing elected trustees with an appointed board.",
  },
];
const descriptions = [
  `${labels.legislature} write school law and fund schools. ${labels.agency} administers school law. ${labels.trustees} govern the district.`,
  `${commissioner.office}: ${commissioner.selection}.`,
  `${commissioner.name} is the ${commissioner.office} and leads the ${rulebook[3].actor}. ${boardOfManagers.label}: ${boardOfManagers.definition}.`,
];
const fade = (progress: number) => ON - (ON - DIM) * progress;
const lit = (progress: number) =>
  `color-mix(in srgb, ${neutral(4)} ${progress * 100}%, ${neutral(2)})`;

export function RulebookStage() {
  const s = useTween({ draw: OFF, appointment: OFF, commissioner: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { draw: ON, duration: DUR.scale, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { appointment: ON, duration: DUR.color, ease: SETTLE });
      beat(1);
      tl.to(s, { commissioner: ON, duration: DUR.color, ease: SETTLE });
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g className={styles.wires} style={{ strokeDashoffset: ON - s.draw }}>
            <path
              d={`M ${G.x} ${G.lawY + G.height / 2} H ${G.x - BOARD.pad * 2} V ${G.agencyY + 48} H ${G.x}`}
              pathLength="1"
            />
            <path
              d={`M ${G.x + G.branchWidth / 2} ${G.appointmentY + G.height} V ${G.agencyY}`}
              pathLength="1"
            />
            <path
              d={`M ${G.right - G.branchWidth / 2} ${G.appointmentY + G.height} V ${G.agencyY}`}
              pathLength="1"
            />
            <path d={`M ${G.x + G.width / 2} ${G.agencyY + 148} V ${G.boardY}`} pathLength="1" />
          </g>
          <g style={{ opacity: fade(s.appointment) }}>
            <rect className="tx-office-box" x={G.x} y={G.lawY} width={G.width} height={G.height} />
            <text className="od-stage-name" x={G.x + BOARD.pad} y={G.lawY + 38}>
              {labels.legislature}
            </text>
            <text className="od-stage-note" x={G.x + BOARD.pad} y={G.lawY + 73}>
              {labels.law}
            </text>
          </g>
          <g style={{ opacity: fade(s.commissioner) }}>
            {[
              { title: labels.governor, role: labels.appoints },
              { title: labels.senate, role: labels.confirms },
            ].map((node, i) => (
              <g
                key={node.title}
                transform={`translate(${i ? G.right - G.branchWidth : G.x} ${G.appointmentY})`}
              >
                <rect
                  className="tx-office-box"
                  width={G.branchWidth}
                  height={G.height}
                  style={{ stroke: lit(s.appointment) }}
                />
                <text className="od-stage-name" x={BOARD.pad} y="38">
                  {node.title}
                </text>
                <text className="od-stage-note" x={BOARD.pad} y="73">
                  {node.role}
                </text>
              </g>
            ))}
          </g>
          <g>
            <rect
              className="tx-office-box"
              x={G.x}
              y={G.agencyY}
              width={G.width}
              height={148}
              style={{ stroke: lit(s.commissioner) }}
            />
            <text className="od-stage-name" x={G.x + BOARD.pad} y={G.agencyY + 38}>
              {labels.agency}
            </text>
            <text className="od-stage-note" x={G.x + BOARD.pad} y={G.agencyY + 73}>
              {labels.administers}
            </text>
            <g style={{ opacity: s.commissioner }}>
              <text
                className={`od-stage-name ${styles.commissioner}`}
                x={G.x + BOARD.pad}
                y={G.agencyY + 119}
              >
                {commissioner.name}
              </text>
              <text className="od-stage-note" x={G.x + 310} y={G.agencyY + 119}>
                {labels.commissioner}
              </text>
            </g>
          </g>
          <g style={{ opacity: fade(s.commissioner) }}>
            <rect
              className="tx-office-box"
              x={G.x}
              y={G.boardY}
              width={G.width}
              height={G.height}
            />
            <text className="od-stage-name" x={G.x + BOARD.pad} y={G.boardY + 38}>
              {labels.trustees}
            </text>
            <text className="od-stage-note" x={G.x + BOARD.pad} y={G.boardY + 73}>
              {labels.governs}
            </text>
          </g>
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">An appointed commissioner enforces school law.</h2>
          <p className={styles.description}>{descriptions[clicks]}</p>
          <StoryLink
            href={clicks === COPY.length - 1 ? interventionSource : rulebookSource}
            label="Source: Texas Education Code"
          />
        </>
      }
      card={<StoryCard anchor="left" lead={copy.lead} body={copy.body} />}
    />
  );
}
