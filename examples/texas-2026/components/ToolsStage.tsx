import {
  DRAW,
  DUR,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  stagger,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { billPath, toolLabels } from "../data/10-tools";
import { DIM, OFF, ON } from "./design";
import styles from "./ToolsStage.module.css";

const COPY = [
  {
    lead: "The governor can nominate a commissioner.",
    body: "The nominee needs Senate confirmation.",
  },
  {
    lead: "Lawmakers must vote to change these requirements.",
    body: "The governor can ask lawmakers to revise the requirements.",
  },
  {
    lead: `${billPath.chambers.join(" and ")} must agree.`,
    body: "Both must pass identical bill text before it goes to the governor.",
  },
];
const itemProgress = (progress: number, i: number) =>
  stagger(progress, i, toolLabels.executive.length, 0.16);

export function ToolsStage() {
  const s = useTween({ executive: OFF, legislative: OFF, first: ON, second: ON });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { executive: ON, duration: DUR.scale, ease: DRAW });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { legislative: ON, first: DIM, duration: DUR.scale, ease: SETTLE });
      beat(1);
      tl.to(s, { second: DIM, duration: DUR.color, ease: SETTLE });
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">Changing school law takes both chambers.</h2>
          <div className={styles.tools}>
            <section className={styles.column} style={{ opacity: s.first }}>
              <h3 style={{ opacity: s.executive }}>{toolLabels.initiate}</h3>
              {toolLabels.executive.map((label, i) => (
                <div
                  key={label}
                  className={styles.tool}
                  style={{
                    opacity: itemProgress(s.executive, i),
                    transform: `translateX(${(ON - itemProgress(s.executive, i)) * 2}%)`,
                  }}
                >
                  <span>{label}</span>
                  {i === 0 && <small>{toolLabels.confirmation}</small>}
                </div>
              ))}
            </section>
            <section
              className={styles.column}
              aria-hidden={clicks < 1}
              style={{ opacity: s.second }}
            >
              <h3 style={{ opacity: s.legislative }}>{toolLabels.legislation}</h3>
              {toolLabels.legislative.map((label, i) => (
                <div
                  key={label}
                  className={styles.tool}
                  style={{
                    opacity: itemProgress(s.legislative, i),
                    transform: `translateX(${(ON - itemProgress(s.legislative, i)) * -2}%)`,
                  }}
                >
                  {label}
                </div>
              ))}
            </section>
          </div>
          <div className="tx-baseline" />
          <StoryLink
            href={clicks === 0 ? toolLabels.executiveSource : toolLabels.source}
            label="Source: Texas Constitution; House legislative process"
          />
        </>
      }
      card={<StoryCard anchor="left" hue="slate" lead={copy.lead} body={copy.body} />}
    />
  );
}
