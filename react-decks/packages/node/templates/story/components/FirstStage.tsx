import { ink, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { FIRST_POINTS } from "../data/01-first";

const COPY = [
  {
    lead: "Keep the evidence in view.",
    body: "Replace these illustrative points with sourced observations.",
  },
  {
    lead: "Explain what changes at each step.",
    body: "Replace this card with a finding from your data.",
  },
];

export function FirstStage() {
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    beats: (_timeline, beat) => {
      beat(0);
      beat(1);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={FIRST_POINTS.map((point) => (
        <circle key={point.x} cx={point.x} cy={point.y} r={16} fill={ink("cyan", 3)} />
      ))}
      overlay={<h1 className="od-story-head">Keep the evidence in view.</h1>}
      card={<StoryCard lead={copy.lead} body={copy.body} />}
    />
  );
}
