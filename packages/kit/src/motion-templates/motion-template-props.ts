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

/** One labelled value: a bar on a board or a segment of a ring. */
export interface Datum {
  readonly label: string;
  readonly value: number;
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
        readonly template: "device-mockup";
        /** Screenshot URL; the deck's own asset import or a public path. */
        readonly src: string;
        readonly alt: string;
        readonly device: "laptop" | "phone" | "browser";
        readonly caption?: string;
      }
    | {
        readonly template: "photo-reveal";
        readonly src: string;
        readonly alt: string;
        readonly caption: string;
        readonly credit?: string;
      }
    | {
        readonly template: "logo-reveal";
        /** An SVG or raster logo. */
        readonly src: string;
        readonly alt: string;
        readonly tagline?: string;
      }
    | {
        readonly template: "icon-array";
        /** How many of `total` icons are highlighted ("1 in 4" is 25 of 100, or 1 of 4). */
        readonly filled: number;
        readonly total: number;
        readonly label: string;
      }
    | {
        readonly template: "team-grid";
        readonly people: readonly {
          readonly name: string;
          readonly role: string;
          readonly src?: string;
        }[];
      }
    | {
        readonly template: "venn-overlap";
        readonly sets: readonly [string, string] | readonly [string, string, string];
        readonly overlap: string;
      }
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
    | {
        readonly template: "word-swap";
        /** One or two fixed lines, up to 18 characters each. */
        readonly lead: readonly string[];
        /** 2 to 5 phrases, up to 16 characters each; each click swaps in the next. */
        readonly words: readonly string[];
      }
    | {
        readonly template: "bar-board";
        /** 2 to 6 rows, largest first; labels up to 16 characters. */
        readonly rows: readonly Datum[];
        /** Up to 60 characters. */
        readonly source: string;
        /** Up to 8 characters. */
        readonly prefix?: string;
        /** Up to 8 characters. */
        readonly suffix?: string;
      }
    | { readonly template: "command-line"; readonly command: string }
    | {
        readonly template: "scramble-text";
        readonly text: string;
        /** Up to 40 characters. */
        readonly label?: string;
      }
    | {
        readonly template: "donut-build";
        /** 2 to 5 parts of a whole, drawn one per click; labels up to 16 characters. */
        readonly segments: readonly Datum[];
        /** Up to 8 characters. */
        readonly prefix?: string;
        /** Up to 8 characters. */
        readonly suffix?: string;
      }
  );

export type MotionTemplateName = MotionTemplateProps["template"];

/** The props one template receives. */
export type TemplateProps<Name extends MotionTemplateName> = Extract<
  MotionTemplateProps,
  { template: Name }
>;
