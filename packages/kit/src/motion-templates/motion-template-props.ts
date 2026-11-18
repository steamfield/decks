import type { Hue } from "../theme/theme-resolve";

/** Props every template takes: the click its entrance plays on, and the theme hue it accents with. */
export interface TemplateBase {
  /** The click the entrance plays on; 0 (the default) plays it on arrival. */
  readonly at?: number;
  /** A theme ramp to accent with; the deck theme's colours, never a raw colour. */
  readonly accent?: Hue;
}

export type MotionTemplateProps = TemplateBase &
  (
    | { readonly template: "title-reveal"; readonly title: string; readonly subtitle?: string }
    | { readonly template: "lower-third"; readonly name: string; readonly role: string }
    | {
        readonly template: "stat-burst";
        readonly value: number;
        readonly label: string;
        readonly suffix?: string;
      }
    | { readonly template: "list-cascade"; readonly items: readonly string[] }
    | { readonly template: "quote-card"; readonly quote: string; readonly source: string }
    | { readonly template: "section-wipe"; readonly number: string; readonly title: string }
  );

export type MotionTemplateName = MotionTemplateProps["template"];

/** The props one template receives. */
export type TemplateProps<Name extends MotionTemplateName> = Extract<
  MotionTemplateProps,
  { template: Name }
>;
