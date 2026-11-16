import { DRAW, DUR, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  EVENT_LINES,
  PRETTY_LINES,
  RAW_ESCAPE_ROWS,
  RAW_LINES,
  RECORDED,
  RESULT_ROW_INDEXES,
} from "../data/02-two-users";
import { OFF, ON } from "./design";
import { TermPane } from "./TermPane";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "rr --pretty prints a summary for a person.",
    body: "It prints each task's host and time, then totals. Designing output for people is developer experience, DX.",
  },
  {
    lead: "The agent reads the colour codes as text.",
    body: "Each escape code takes up space in its context.",
  },
  {
    lead: "Without the flag, rr prints JSON events.",
    body: "The last event lists each failing test. Designing output for agents is agent experience, AX.",
  },
];

const PANE = { y: 196, width: 838, height: 494, size: 26 };
const LEFT_X = 110;
const RIGHT_X = 972;

export function TwoUsersStage() {
  const s = useTween({ frame: OFF, pretty: OFF, right: OFF, raw: OFF, json: OFF, events: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { pretty: PRETTY_LINES.length, duration: DUR.scale, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { right: ON, duration: DUR.card, ease: SETTLE });
      tl.to(s, { raw: RAW_LINES.length, duration: DUR.scale, ease: "none" });
      beat(1);
      tl.to(s, { json: ON, duration: DUR.grow, ease: DRAW });
      tl.to(s, { events: EVENT_LINES.length, duration: DUR.grow, ease: "none" }, "<");
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">My tools have two users: me and a coding agent.</h2>
          <TermPane
            lines={PRETTY_LINES}
            shown={s.pretty}
            x={LEFT_X}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={s.frame}
            label="What I see"
            tag={`Recorded ${RECORDED} · rr --pretty test`}
          />
          <TermPane
            lines={RAW_LINES}
            shown={s.raw}
            highlight={RAW_ESCAPE_ROWS}
            x={RIGHT_X}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={s.frame}
            power={s.right}
            label="What the agent reads"
            tag={`Recorded ${RECORDED} · the same output, as bytes`}
          />
          <TermPane
            lines={EVENT_LINES}
            shown={s.events}
            highlight={RESULT_ROW_INDEXES}
            x={RIGHT_X}
            y={PANE.y}
            width={PANE.width}
            height={PANE.height}
            size={PANE.size}
            progress={s.json}
            label="What the agent reads"
            tag={`Recorded ${RECORDED} · rr test, JSON events on stderr`}
          />
          <ThreadRail />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
