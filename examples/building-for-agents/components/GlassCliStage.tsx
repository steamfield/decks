import { DUR, SETTLE, STAGE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { Fragment } from "react";
import { GAP_LINE, READ_COMMANDS, RETRY, RFC_SIZES, SESSION } from "../data/23-glass-cli";
import { WHY_RUST } from "../data/code/23-glass-cli";
import type { TermLine } from "../data/types";
import { DIM, OFF, ON } from "./design";
import styles from "./GlassCliStage.module.css";
import { NamePlate } from "./NamePlate";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const [TS_LOW, TS_HIGH] = RFC_SIZES.compiledTsBinaryMb;
const COMMAND_LIST = `${READ_COMMANDS.slice(0, -1).join(", ")} and ${READ_COMMANDS[READ_COMMANDS.length - 1]}`;
const COPY = [
  {
    lead: "The statglass CLI reads recorded history.",
    body: `${COMMAND_LIST} work on this Mac or on any remote host StatGlass mirrors.`,
  },
  {
    lead: "History output lists gaps in the samples.",
    body: "The gap line gives the time range and the cause. Errors come back as JSON with a next step.",
  },
  {
    lead: "The RFC chose Rust for the CLI.",
    body: `It estimates a compiled TypeScript CLI at ${TS_LOW} to ${TS_HIGH} MB, against a ${RFC_SIZES.appMb} MB app.`,
  },
];

const PANE = { x: 110, y: 190, width: 1150, height: 510 };
const QUOTE = { x: 1300, y: 190, w: 510 };
/** The RFC's paragraph, with its one command set apart as code. */
const quote = WHY_RUST.code
  .split("\n")
  .join(" ")
  .split("`")
  .map((text, i) => ({ text, code: i % 2 === 1 }));
const source = `${WHY_RUST.repo}/${WHY_RUST.path}`;
const sourceLines = `lines ${WHY_RUST.start} to ${WHY_RUST.end}`;

export function GlassCliStage() {
  const s = useTween({ pane: OFF, typed: OFF, more: OFF, session: ON, quote: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { pane: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { typed: SESSION.length, duration: DUR.scale, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { more: RETRY.length, duration: DUR.grow, ease: "none" });
      beat(1);
      tl.to(s, { session: DIM, duration: DUR.card, ease: SETTLE });
      tl.to(s, { quote: ON, duration: DUR.card, ease: SETTLE });
      beat(2);
    },
  });
  const lines: TermLine[] = [
    ...SESSION.map(
      (line, i): TermLine => (i === GAP_LINE && clicks >= 1 ? { ...line, tone: "warn" } : line),
    ),
    ...RETRY,
  ];
  const shown = Math.floor(s.typed + 1e-6) + Math.floor(s.more + 1e-6);
  const quoteBox = {
    left: `${(QUOTE.x / STAGE.width) * 100}%`,
    top: `${(QUOTE.y / STAGE.height) * 100}%`,
    width: `${(QUOTE.w / STAGE.width) * 100}%`,
    opacity: s.quote,
    transform: `translateY(calc(${(ON - s.quote) * 0.6} * var(--sw)))`,
  };

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">Agents read StatGlass history through a CLI.</h2>
          <NamePlate id="statglass" chipOnly />
          <TermPane
            lines={lines}
            shown={shown}
            size={26}
            follow={false}
            progress={s.pane}
            power={s.session}
            tag="Illustrative session · output format from the CLI's tests"
            {...PANE}
          />
          <figure className={`glass-quote ${styles["glass-quote"]}`} style={quoteBox}>
            <div className={`glass-quote-label ${styles["glass-quote-label"]}`}>
              From the agent CLI RFC
            </div>
            <div className={`glass-quote-text ${styles["glass-quote-text"]}`}>
              {quote.map((part) => (
                <Fragment key={part.text}>
                  {part.code ? <code>{part.text}</code> : part.text}
                </Fragment>
              ))}
            </div>
            <figcaption className={`glass-quote-source ${styles["glass-quote-source"]}`}>
              {source}
              <br />
              {sourceLines}
            </figcaption>
          </figure>
          <ThreadRail current="statglass" />
        </>
      }
      card={<StoryCard anchor="left" hue="emerald" lead={copy.lead} body={copy.body} />}
    />
  );
}
