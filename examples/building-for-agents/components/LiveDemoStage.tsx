import { type TermPaneSpec, useDeck, useSlide } from "@steamfield/decks";
import { DUR, SETTLE, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import type { ProductId } from "../data/products";
import codeStyles from "./CodePane.module.css";
import { CrtPanel } from "./CrtPanel";
import { tokenizeLine } from "./code-tokens";
import { CRT, FRAME, OFF, ON } from "./design";
import styles from "./LiveDemoStage.module.css";
import { LiveTerm, type TermRecording } from "./LiveTerm";
import { NamePlate } from "./NamePlate";
import { ThreadRail } from "./ThreadRail";

export interface LiveDemo {
  headline: string;
  product: ProductId;
  /** One or two panes, sized by paneGrid. */
  panes: readonly {
    pane: TermPaneSpec;
    recording: TermRecording;
    label: string;
  }[];
  copy: readonly { lead: string }[];
}

const PANE = { y: 154, height: 684, gap: 22 };
const COMMANDS_Y = PANE.y + PANE.height + PANE.gap;

/** VT323 advances 0.4em; reserve the next whole-pixel cell for xterm's font snapping. */
export function paneGrid(count: number) {
  if (count !== 1 && count !== 2) throw new Error(`Demo pane count ${count} must be 1 or 2`);
  const width = (FRAME.right - FRAME.left - (count - 1) * PANE.gap) / count;
  const size = count === 1 ? 28 : 24;
  const cell = Math.ceil(size * 0.4);
  return {
    width,
    size,
    cols: Math.floor((width - 80) / cell),
    rows: Math.floor((PANE.height - 2 * CRT.pad - CRT.tagBand - 38.4) / ((cell / 0.4) * 1.12)),
  };
}

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
  const { width, size, rows, cols } = paneGrid(demo.panes.length);
  const panes = demo.panes;
  for (const { pane } of panes)
    if (pane.rows !== rows || pane.cols !== cols)
      throw new Error(
        `Pane "${pane.id}" must use paneGrid(${panes.length}): ${rows} rows by ${cols} columns`,
      );
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

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">{demo.headline}</h2>
          <NamePlate id={demo.product} chipOnly />
          {panes.map(({ pane, recording, label }, index) => {
            const x = FRAME.left + index * (width + PANE.gap);
            return (
              <div key={pane.id}>
                <div className={`${styles.tube} ${styles.off}`} aria-hidden={clicks !== 0}>
                  <CrtPanel
                    x={x}
                    y={PANE.y}
                    width={width}
                    height={PANE.height}
                    label={label}
                    fig={copy.lead}
                    power={OFF}
                    progress={ON - s.power}
                  />
                </div>
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
                    recording={viewport(recording, clicks, pane.rows)}
                    click={clicks}
                    x={x}
                    y={PANE.y}
                    width={width}
                    height={PANE.height}
                    label={label}
                    caption={copy.lead}
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
    />
  );
}
