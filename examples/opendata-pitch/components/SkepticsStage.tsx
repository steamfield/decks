import { useSlide } from "@steamfield/decks";
import {
  DRAW,
  DUR,
  type GrowHandle,
  InkNumber,
  StoryCard,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { motionMode, useTween } from "@steamfield/decks/motion";
import { useRef } from "react";
import { CONVERSATIONS, REACH_FIGURE, REACH_LABEL } from "../data/signals";
import styles from "./SkepticsStage.module.css";

const COPY = [
  {
    lead: "1M+ reads, and none of them engineers.",
    body: "Data stories built on the catalog pulled 1M+ views. The readers were journalists, economists and researchers.",
  },
  {
    lead: "Every conversation lands on the same worry.",
    body: "State agencies, newsrooms, enterprises. Interest everywhere, and one question each time: does the AI make numbers up?",
  },
  {
    lead: "So verifiability is the product.",
    body: "Every answer traces to a query a skeptic can rerun.",
  },
];

export function SkepticsStage() {
  const s = useTween({ rows: 0, answer: 0 });
  const reach = useRef<GrowHandle>(null);
  const { isActive, renderContext } = useSlide();
  const live = isActive && renderContext === "slide" && motionMode() === "live";
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      reach.current?.addGrow(tl, 0);
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { rows: 1, duration: DUR.scale, ease: DRAW });
      beat(1);
      tl.to(s, { answer: 1, duration: DUR.card }, `+=${DUR.opacity}`);
      beat(2);
    },
  });
  const rowProgress = (i: number) => stagger(s.rows, i, CONVERSATIONS.length, 0.16);
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">Verifiability is what converts the skeptics.</h2>
          <div className={styles.signals}>
            <div
              className={styles.figure}
              style={{ opacity: 1 - 0.6 * s.rows, transition: live ? undefined : "none" }}
            >
              <InkNumber
                ref={reach}
                value={REACH_FIGURE}
                label={REACH_LABEL}
                size={5.6}
                hue="cyan"
                step={3}
              />
            </div>
            <ul className={styles.rows}>
              {CONVERSATIONS.map((row, i) => (
                <li
                  key={row.who}
                  className={styles.row}
                  style={{
                    opacity: rowProgress(i) * (1 - 0.55 * s.answer),
                    transform: `translateY(${(1 - rowProgress(i)) * 10}px)`,
                  }}
                >
                  <span>{row.who}</span>
                  {row.tag !== "discovery" && (
                    <span className={`od-mono ${styles.tag}`}>{row.tag}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      }
      card={<StoryCard anchor="right" lead={copy.lead} body={copy.body} />}
    />
  );
}
