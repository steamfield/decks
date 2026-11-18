import type { ReactNode } from "react";
import { ListCascade } from "./list-cascade";
import { LowerThird } from "./lower-third";
import type { MotionTemplateProps } from "./motion-template-props";
import { QuoteCard } from "./quote-card";
import { SectionWipe } from "./section-wipe";
import { StatBurst } from "./stat-burst";
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
    case "list-cascade":
      return <ListCascade {...props} />;
    case "quote-card":
      return <QuoteCard {...props} />;
    case "section-wipe":
      return <SectionWipe {...props} />;
  }
}
