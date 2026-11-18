import type { Hue } from "../theme/theme-resolve";

/** Props every template takes: the click its entrance plays on, and the theme hue it accents with. */
export interface TemplateBase {
  /** The click the entrance plays on; 0 (the default) plays it on arrival. */
  readonly at?: number;
  /** A theme ramp to accent with; the deck theme's colours, never a raw colour. */
  readonly accent?: Hue;
}

export interface Metric {
  readonly value: number;
  readonly label: string;
  readonly suffix?: string;
}

export interface Side {
  readonly title: string;
  readonly points: readonly string[];
}

export type MotionTemplateProps = TemplateBase &
  (
    | { readonly template: "title-reveal"; readonly title: string; readonly subtitle?: string }
    | { readonly template: "lower-third"; readonly name: string; readonly role: string }
    | ({ readonly template: "stat-burst" } & Metric)
    | {
        readonly template: "stat-compare";
        readonly from: number;
        readonly to: number;
        readonly label: string;
        readonly suffix?: string;
      }
    | { readonly template: "metric-grid"; readonly metrics: readonly Metric[] }
    | { readonly template: "list-cascade"; readonly items: readonly string[] }
    | { readonly template: "quote-card"; readonly quote: string; readonly source: string }
    | { readonly template: "section-wipe"; readonly number: string; readonly title: string }
    | {
        readonly template: "agenda";
        readonly items: readonly string[];
        /** The 1-based item being introduced; earlier items read as done. */
        readonly current: number;
      }
    | { readonly template: "end-card"; readonly title: string; readonly link?: string }
    | {
        readonly template: "timeline-sweep";
        readonly events: readonly { readonly date: string; readonly label: string }[];
      }
    | { readonly template: "process-flow"; readonly steps: readonly string[] }
    | { readonly template: "comparison-split"; readonly left: Side; readonly right: Side }
    | { readonly template: "myth-fact"; readonly myth: string; readonly fact: string }
    | {
        readonly template: "spotlight";
        /** Image URL; the deck's own asset import or a public path. */
        readonly src: string;
        readonly alt: string;
        /** Centre of the spotlight as fractions of the image (0 to 1). */
        readonly x: number;
        readonly y: number;
        readonly label: string;
      }
  );

export type MotionTemplateName = MotionTemplateProps["template"];

/** The props one template receives. */
export type TemplateProps<Name extends MotionTemplateName> = Extract<
  MotionTemplateProps,
  { template: Name }
>;
