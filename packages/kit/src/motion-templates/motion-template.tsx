import type { ReactNode } from "react";
import { Agenda } from "./agenda";
import { ComparisonSplit } from "./comparison-split";
import { EndCard } from "./end-card";
import { ListCascade } from "./list-cascade";
import { LowerThird } from "./lower-third";
import { MetricGrid } from "./metric-grid";
import type { MotionTemplateProps } from "./motion-template-props";
import { MythFact } from "./myth-fact";
import { ProcessFlow } from "./process-flow";
import { QuoteCard } from "./quote-card";
import { SectionWipe } from "./section-wipe";
import { Spotlight } from "./spotlight";
import { StatBurst } from "./stat-burst";
import { StatCompare } from "./stat-compare";
import { TimelineSweep } from "./timeline-sweep";
import { TitleReveal } from "./title-reveal";

/**
 * A ready-made motion graphic: pick a template, give it the words, and it takes colour, type
 * and timing from the deck theme and motion tokens. Each template is one readable file in this
 * folder, shipped in the package's docs/motion-templates/ as a reference for custom motion.
 */
export function MotionTemplate(props: MotionTemplateProps): ReactNode {
  switch (props.template) {
    case "title-reveal":
      return <TitleReveal {...props} />;
    case "lower-third":
      return <LowerThird {...props} />;
    case "stat-burst":
      return <StatBurst {...props} />;
    case "stat-compare":
      return <StatCompare {...props} />;
    case "metric-grid":
      return <MetricGrid {...props} />;
    case "list-cascade":
      return <ListCascade {...props} />;
    case "quote-card":
      return <QuoteCard {...props} />;
    case "section-wipe":
      return <SectionWipe {...props} />;
    case "agenda":
      return <Agenda {...props} />;
    case "end-card":
      return <EndCard {...props} />;
    case "timeline-sweep":
      return <TimelineSweep {...props} />;
    case "process-flow":
      return <ProcessFlow {...props} />;
    case "comparison-split":
      return <ComparisonSplit {...props} />;
    case "myth-fact":
      return <MythFact {...props} />;
    case "spotlight":
      return <Spotlight {...props} />;
  }
}
