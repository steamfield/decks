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
  // Timelines and text splits are built once per mount; new content gets a fresh mount.
  const key = JSON.stringify(props);
  switch (props.template) {
    case "title-reveal":
      return <TitleReveal key={key} {...props} />;
    case "lower-third":
      return <LowerThird key={key} {...props} />;
    case "stat-burst":
      return <StatBurst key={key} {...props} />;
    case "stat-compare":
      return <StatCompare key={key} {...props} />;
    case "metric-grid":
      return <MetricGrid key={key} {...props} />;
    case "list-cascade":
      return <ListCascade key={key} {...props} />;
    case "quote-card":
      return <QuoteCard key={key} {...props} />;
    case "section-wipe":
      return <SectionWipe key={key} {...props} />;
    case "agenda":
      return <Agenda key={key} {...props} />;
    case "end-card":
      return <EndCard key={key} {...props} />;
    case "timeline-sweep":
      return <TimelineSweep key={key} {...props} />;
    case "process-flow":
      return <ProcessFlow key={key} {...props} />;
    case "comparison-split":
      return <ComparisonSplit key={key} {...props} />;
    case "myth-fact":
      return <MythFact key={key} {...props} />;
    case "spotlight":
      return <Spotlight key={key} {...props} />;
  }
}
