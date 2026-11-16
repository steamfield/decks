import { useDeck, useSlide } from "@steamfield/decks";
import { DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import type { ProductId } from "../data/products";
import type { TermPaneSpec } from "../term/protocol";
import codeStyles from "./CodePane.module.css";
import { tokenizeLine } from "./code-tokens";
import { CRT, FRAME, OFF, ON } from "./design";
import styles from "./LiveDemoStage.module.css";
import { LiveTerm, type TermRecording } from "./LiveTerm";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";

export interface LiveDemo {
  headline: string;
  product: ProductId;
  /** One or two panes; a two-pane demo allows at most 80 columns per pane. */
  panes: readonly {
    pane: TermPaneSpec;
    recording: TermRecording;
    label: string;
  }[];
  copy: readonly { lead: string; body: string }[];
}

const PANE = { y: 174, height: 470, gap: 22 };
const COMMANDS_Y = PANE.y + PANE.height + PANE.gap;

/** Keep whole exchanges, including the newest command, inside the readable viewport. */
function viewport(recording: TermRecording, click: number, rows: number): TermRecording {
  if (recording.kind === "poster") return recording;
  const end = recording.shownAt[Math.min(click, recording.shownAt.length - 1)] ?? 0;
  const start = recording.shownAt.slice(0, click).find((at) => end - at <= rows) ?? 0;
  if (end - start > rows)
    throw new Error(`Recording "${recording.tag}" at click ${click} exceeds ${rows} readable rows`);
  return {
    ...recording,
    lines: recording.lines.slice(start, end),
    shownAt: recording.shownAt.map((at) => Math.max(0, at - start)),
  };
}

function commandTokens(command: string) {
  let nextName = true;
  return [...command.matchAll(/"(?:[^"\\]|\\.)*"|'[^']*'|&&|\|\||[|;<>]|\s+|[^\s|;<>]+/g)].flatMap(
    ([text]) => {
      if (/^\s+$/.test(text)) return [{ text, kind: "plain" }];
      if (/^(?:&&|\|\||[|;])$/.test(text)) {
        nextName = true;
        return [{ text, kind: "punct" }];
      }
      if (nextName) {
        nextName = false;
        return [{ text, kind: "keyword" }];
      }
      if (text.startsWith("-")) return [{ text, kind: "type" }];
      return tokenizeLine(text, "sh");
    },
  );
}

export function LiveDemoStage({ demo }: { demo: LiveDemo }) {
  for (const { pane } of demo.panes) {
    if (demo.panes.length === 2 && pane.cols > 80)
      throw new Error(
        `Pane "${pane.id}" has ${pane.cols} columns; two-pane demos allow at most 80.`,
      );
  }
  const deck = useDeck();
  const slide = useSlide();
  const s = useTween({ power: OFF });
  const { clicks, copy, beats } = useStage({
    copy: demo.copy,
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { power: ON, duration: DUR.card, ease: SETTLE });
      for (let n = 1; n < demo.copy.length; n++) beat(n);
    },
  });
  const width = (FRAME.right - FRAME.left - (demo.panes.length - 1) * PANE.gap) / demo.panes.length;

  return (
    <StoryStage
      className={styles.stage}
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">{demo.headline}</h2>
          <NamePlate id={demo.product} chipOnly />
          {demo.panes.map(({ pane, recording, label }, index) => {
            const x = FRAME.left + index * (width + PANE.gap);
            const size = Math.min(28, (width - 80) / ((pane.cols + 2) / 2));
            const rows = Math.min(
              pane.rows,
              Math.floor((PANE.height - 2 * CRT.pad - CRT.tagBand - 48) / (size * 1.12)),
            );
            return (
              <div key={pane.id}>
                <div
                  className={styles.tube}
                  aria-hidden={clicks === 0}
                  style={{
                    opacity: s.power,
                    clipPath: `inset(${((PANE.y + ((1 - s.power) * PANE.height) / 2) / FRAME.height) * 100}% ${((FRAME.width - x - width) / FRAME.width) * 100}% ${((FRAME.height - PANE.y - ((1 + s.power) * PANE.height) / 2) / FRAME.height) * 100}% ${(x / FRAME.width) * 100}%)`,
                  }}
                >
                  <LiveTerm
                    pane={pane}
                    recording={viewport(recording, clicks, rows)}
                    click={clicks}
                    x={x}
                    y={PANE.y}
                    width={width}
                    height={PANE.height}
                    label={label}
                    size={size}
                  />
                </div>
                <div
                  className={styles.commands}
                  style={{
                    left: `${(x / FRAME.width) * 100}%`,
                    top: `${(COMMANDS_Y / FRAME.height) * 100}%`,
                    width: `${(width / FRAME.width) * 100}%`,
                  }}
                >
                  {pane.commands.map((command, n) => {
                    let offset = 0;
                    const done = clicks > n;
                    const next = clicks === n;
                    const runnable =
                      next &&
                      deck.slide === slide.no &&
                      (slide.isActive || slide.renderContext === "presenter");
                    return (
                      <div
                        key={command}
                        className={`${styles.command} ${next ? styles.next : done ? styles.done : styles.waiting}`}
                      >
                        <code>
                          {commandTokens(command).map((token) => {
                            const start = offset;
                            offset += token.text.length;
                            return (
                              <span
                                key={start}
                                className={`${codeStyles[`sf-tok-${token.kind}`]}${/^\S+$/.test(token.text) ? ` ${styles.word}` : ""}`}
                              >
                                {token.text}
                              </span>
                            );
                          })}
                        </code>
                        {slide.renderContext === "slide" || slide.renderContext === "presenter" ? (
                          <button
                            className={styles.control}
                            type="button"
                            aria-label={`Run: ${command}`}
                            aria-disabled={!runnable}
                            onClick={() => {
                              if (runnable) deck.next();
                            }}
                          >
                            <span aria-hidden="true">{done ? "✓" : "▶"}</span>
                          </button>
                        ) : (
                          <span className={styles.control} aria-hidden="true">
                            {done ? "✓" : "▶"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <ThreadRail current={demo.product} />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
