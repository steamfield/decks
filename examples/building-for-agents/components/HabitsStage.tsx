import { DUR, SETTLE, StoryCard, StoryStage, stagger, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { countWord } from "../data/03-thread";
import { HABITS, ROWS_PER_BEAT } from "../data/19-habits";
import { PRODUCTS } from "../data/products";
import { DIM, FRAME, DATA as LIT, OFF, ON } from "./design";
import { PixelIcon } from "./PixelIcon";
import { ThreadRail } from "./ThreadRail";

const count = (id: string) =>
  Object.keys(HABITS.find((habit) => habit.id === id)?.cells ?? {}).length;
const COPY = [
  {
    lead: `${countWord(count("output"))} tools print JSON a program can parse.`,
    body: `The same ${countWord(count("next")).toLowerCase()} also print the next step, as a field or a line of text.`,
  },
  {
    lead: "A command checks when work is finished.",
    body: `Stacks has verify, and Decks has check and lint; ${countWord(count("exit")).toLowerCase()} tools document one action per exit code.`,
  },
  {
    lead: "Agents run in parallel and read bundled docs.",
    body: `rr locks a host and foreman uses a worktree per task; ${countWord(count("docs")).toLowerCase()} tools ship their own guide or skill.`,
  },
  {
    lead: "Any CLI or library can adopt these habits.",
    body: "The six habits are output formats, exit codes, locks and bundled docs; none of them calls a model.",
  },
];

const COLS_X = 612;
const COL = (FRAME.right - COLS_X) / PRODUCTS.length;
const HEAD = { icon: 40, iconY: 198, nameY: 270, nameSize: 22 };
const ROW = { y: 292, height: 68 };
const CELL = { width: COL - 12, height: 50 };
const PAIRS = Math.ceil(HABITS.length / ROWS_PER_BEAT);
const columns = PRODUCTS.map((p, i) => ({ ...p, x: COLS_X + (i + 0.5) * COL }));
const rows = HABITS.map((habit, i) => ({
  ...habit,
  pair: Math.floor(i / ROWS_PER_BEAT),
  y: ROW.y + i * ROW.height,
  mid: ROW.y + i * ROW.height + ROW.height / 2,
}));
const key = (k: number) => `p${k}`;

export function HabitsStage() {
  const s = useTween({ frame: OFF, end: OFF });
  const pairs = useTween<Record<string, number>>(
    Object.fromEntries(Array.from({ length: PAIRS }, (_, k) => [key(k), OFF])),
  );
  const lit = (k: number) => pairs[key(k)] ?? OFF;
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
      tl.to(pairs, { [key(0)]: ON, duration: DUR.scale, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      for (let k = 1; k < PAIRS; k++) {
        tl.to(pairs, { [key(k)]: ON, duration: DUR.scale, ease: "none" });
        beat(k);
      }
      tl.to(s, { end: ON, duration: DUR.color, ease: SETTLE });
      beat(PAIRS);
    },
  });
  const after = (k: number) => (k + 1 < PAIRS ? lit(k + 1) : s.end);
  const cellLevel = (k: number) => ON - after(k) * (ON - DIM);
  const labelLevel = (k: number) =>
    DIM + (ON - DIM) * Math.max(lit(k) * (ON - (k + 1 < PAIRS ? lit(k + 1) : OFF)), s.end);
  const cellProgress = (k: number, col: number) => stagger(lit(k), col, columns.length, 0.1);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g style={{ opacity: s.frame }}>
          {columns.map((col) => (
            <g key={col.id} style={{ opacity: ON - s.end * (ON - DIM) }}>
              <PixelIcon
                id={col.id}
                x={col.x - HEAD.icon / 2}
                y={HEAD.iconY}
                width={HEAD.icon}
                height={HEAD.icon}
              />
              <text
                className="sf-name"
                x={col.x}
                y={HEAD.nameY}
                textAnchor="middle"
                style={{ fontSize: `${HEAD.nameSize}px` }}
              >
                {col.name}
              </text>
            </g>
          ))}
          {rows.map((row) => (
            <g key={row.id}>
              <line
                className="sf-wire"
                x1={FRAME.left}
                x2={FRAME.right}
                y1={row.y}
                y2={row.y}
                style={{ opacity: DIM }}
              />
              <text
                className="sf-name"
                x={FRAME.left}
                y={row.mid + 9}
                style={{ opacity: labelLevel(row.pair) }}
              >
                {row.label}
              </text>
              {columns.map((col, c) => (
                <g key={col.id}>
                  {row.cells[col.id] && (
                    <g
                      style={{
                        opacity: cellProgress(row.pair, c) * cellLevel(row.pair),
                        color: LIT,
                      }}
                    >
                      <rect
                        className="sf-box is-lit"
                        x={col.x - CELL.width / 2}
                        y={row.mid - CELL.height / 2}
                        width={CELL.width}
                        height={CELL.height}
                      />
                      <text
                        className="sf-mono is-small"
                        x={col.x}
                        y={row.mid + 6}
                        textAnchor="middle"
                        style={{ fill: LIT }}
                      >
                        {row.cells[col.id]?.mark}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </g>
          ))}
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">Each tool has some of the same six habits.</h2>
          <ThreadRail all />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
