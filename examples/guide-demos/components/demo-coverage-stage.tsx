import { DUR, ink, SETTLE, StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import {
  ALERT_RULES,
  WITH_RUNBOOK_JULY,
  WITH_RUNBOOK_OCTOBER,
} from "../data/demo-runbook-coverage";

const COLUMNS = 8;
const PITCH = 84;
const ORIGIN = { x: 1080, y: 380 };
const DOTS = Array.from({ length: ALERT_RULES }, (_, i) => ({
  x: ORIGIN.x + (i % COLUMNS) * PITCH,
  y: ORIGIN.y + Math.floor(i / COLUMNS) * PITCH,
}));

const JULY = [
  {
    lead: "Each dot is one alert rule.",
    body: `${ALERT_RULES} rules can page the platform team. Illustrative figures.`,
  },
  {
    lead: `${WITH_RUNBOOK_JULY} of ${ALERT_RULES} linked a runbook.`,
    body: "For the rest, whoever was paged started from scratch.",
  },
];

const OCTOBER = [
  {
    lead: `The same ${ALERT_RULES} rules, one quarter later.`,
    body: "Each team wrote the runbooks for its own alerts.",
  },
  {
    lead: `${WITH_RUNBOOK_OCTOBER} of ${ALERT_RULES} now link a runbook.`,
    body: "The alerts still without one are up for removal.",
  },
];

function CoverageStage({
  head,
  copy,
  from,
  to,
}: {
  head: string;
  copy: { lead: string; body: string }[];
  from: number;
  to: number;
}) {
  const s = useTween({ covered: from });
  const {
    clicks,
    copy: card,
    beats,
  } = useStage({
    copy,
    beats: (tl, beat) => {
      beat(0);
      tl.fromTo(s, { covered: from }, { covered: to, duration: DUR.grow, ease: SETTLE });
      beat(1);
    },
  });
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={DOTS.map((dot, i) => (
        <g key={`${dot.x}-${dot.y}`}>
          <circle cx={dot.x} cy={dot.y} r={26} fill={ink("slate", 2)} />
          <circle
            cx={dot.x}
            cy={dot.y}
            r={26}
            fill={ink("emerald", 3)}
            opacity={Math.min(1, Math.max(0, s.covered - i))}
          />
        </g>
      ))}
      overlay={<h2 className="od-story-head">{head}</h2>}
      card={<StoryCard hue="emerald" lead={card.lead} body={card.body} />}
    />
  );
}

export function CoverageJulyStage() {
  return (
    <CoverageStage
      head="In July, most alerts had no runbook."
      from={0}
      to={WITH_RUNBOOK_JULY}
      copy={JULY}
    />
  );
}

export function CoverageOctoberStage() {
  return (
    <CoverageStage
      head="By October, most alerts had one."
      from={WITH_RUNBOOK_JULY}
      to={WITH_RUNBOOK_OCTOBER}
      copy={OCTOBER}
    />
  );
}
