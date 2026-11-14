import { DUR, SETTLE, StoryCard, StoryLink, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  futureColumns,
  futureDimensions,
  futureDisplay,
  futureRows,
  houston,
  petitions,
} from "../data/13-futures";
import { DIM, OFF, ON } from "./design";
import styles from "./FuturesStage.module.css";

const COPY = [
  {
    lead: `Valid petitions would close ${petitions.campuses.join(" and ")}.`,
    body: "Initial counts topped the required majority. TEA is reviewing a complaint about signatures.",
  },
  {
    lead: "If petitions fail, a state board takes over.",
    body: "Morath may appoint it. Once confirmed, her commissioner can replace every manager.",
  },
  {
    lead: "Hinojosa's TEA would run a different takeover.",
    body: `She pledged to end state takeovers. Morath's TEA has run Houston's since ${houston.installed.slice(0, 4)}.`,
  },
];

export function FuturesStage() {
  const rows = [
    useTween({ reveal: ON, emphasis: ON }),
    useTween({ reveal: OFF, emphasis: ON }),
    useTween({ reveal: OFF, emphasis: ON }),
  ];
  const s = useTween({ arrive: OFF, middle: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { arrive: ON, duration: DUR.grow, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      for (let i = 1; i < COPY.length; i++) {
        const row = rows[i];
        const previous = rows[i - 1];
        if (!row || !previous) throw new Error(`FuturesStage has no row at ${i}`);
        tl.to(row, { reveal: ON, duration: DUR.card, ease: SETTLE });
        tl.to(previous, { emphasis: DIM, duration: DUR.color, ease: SETTLE }, "<");
        beat(i);
      }
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">Most likely, two schools close and the board stays.</h2>
          <div className={styles.futures} style={{ opacity: s.arrive }}>
            {futureColumns.map((column, c) => (
              <div key={column.label} className={styles.future}>
                <header style={{ opacity: c === 0 ? ON : ON - s.middle * (ON - DIM) }}>
                  <strong>{column.label}</strong>
                  <span className="tx-tag is-scenario">{column.tag}</span>
                </header>
                {futureDimensions.map((dimension, r) => {
                  const row = rows[r];
                  const outcomes = futureRows[r];
                  if (!row || !outcomes)
                    throw new Error(`FuturesStage has no dimension row at ${r}`);
                  return (
                    <div
                      key={dimension}
                      className={styles.futureRow}
                      aria-hidden={r > clicks}
                      style={{
                        opacity:
                          row.reveal *
                          (c === 0
                            ? row.emphasis + s.middle * (ON - row.emphasis)
                            : Math.min(row.emphasis, ON - s.middle * (ON - DIM))),
                      }}
                    >
                      <span className={styles.dimension}>{dimension}</span>
                      <span className={styles.outcome}>{outcomes[c]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <StoryLink href={futureDisplay.sourceUrl} label={futureDisplay.source} />
        </>
      }
      card={<StoryCard anchor="left" hue="slate" lead={copy.lead} body={copy.body} />}
    />
  );
}
