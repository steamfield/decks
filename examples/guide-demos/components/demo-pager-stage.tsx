import {
  type BarsHandle,
  DUR,
  InkBars,
  ink,
  StoryCard,
  StoryStage,
  useStage,
} from "@steamfield/decks/kit";
import { useRef } from "react";
import { AFTER, BEFORE, DOMAIN } from "../data/demo-night-pages";

const BAR_X: [number, number] = [1000, 1680];
const BAR_BAND: [number, number] = [330, 830];
const TOP = BEFORE.reduce((a, b) => (b.value > a.value ? b : a));
const REST = BEFORE.filter((row) => row.id !== TOP.id).reduce((sum, row) => sum + row.value, 0);
const TOP_AFTER = AFTER.find((row) => row.id === TOP.id)?.value ?? 0;

const COPY = [
  {
    lead: "Night pages per week, by service.",
    body: "Pages between 10 p.m. and 7 a.m. Illustrative figures.",
  },
  {
    lead: `${TOP.label} paged more than the rest.`,
    body: `${TOP.value} pages a week, against ${REST} for the other ${BEFORE.length - 1} services combined.`,
  },
  {
    lead: `Its runbooks cut that to ${TOP_AFTER}.`,
    body: "Each alert now links the steps that fix it, and most fixes run on their own.",
  },
];

export function PagerStage() {
  const bars = useRef<BarsHandle>(null);
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => bars.current?.addGrow(tl),
    beats: (tl, beat) => {
      beat(0);
      bars.current?.addRecolor(tl, TOP.id, ink("rose", 3));
      beat(1);
      // Start just after the label, so click 1 does not already show the new value labels.
      bars.current?.addReorder(tl, AFTER, DOMAIN, `+=${DUR.tick}`);
      beat(2);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <InkBars
          ref={bars}
          rows={BEFORE}
          domain={DOMAIN}
          xRange={BAR_X}
          yBand={BAR_BAND}
          labelWidth={320}
          hue="slate"
          step={3}
        />
      }
      overlay={<h2 className="od-story-head">Runbooks cut the pages that wake people up.</h2>}
      card={<StoryCard lead={copy.lead} body={copy.body} />}
    />
  );
}
