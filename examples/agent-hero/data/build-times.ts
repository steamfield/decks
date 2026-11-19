/// <reference types="vite/client" />
// Illustrative data for a fictional platform team: weekly median CI build minutes, read from
// ./build-times.csv (the file the user hands the agent). Not a measurement of any real team.
// See ../data-sources.md, slides 02-cover, 03-trend and 04-stat.
import csv from "./build-times.csv?raw";
import { CHANGES } from "./changes";

/** One row per week of build-times.csv: the median build time that week, in minutes. */
export const WEEKS = csv
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [week, minutes] = line.split(",");
    return { week: `W${Number(week)}`, minutes: Number(minutes) };
  });

const first = WEEKS[0];
const last = WEEKS.at(-1);
if (!first || !last) throw new Error(`build-times.csv has no weekly rows: "${csv}"`);

/** Week 1's median, rounded to whole minutes for display: 14. */
export const BEFORE = Math.round(first.minutes);
/** The last week's median, rounded to whole minutes for display: 4. */
export const AFTER = Math.round(last.minutes);
/** Minutes the median fell over the period: 10. */
export const DROP = BEFORE - AFTER;

export const COVER_TITLE = `Our builds went from ${BEFORE} minutes to ${AFTER}.`;
export const TREND_HEADLINE = `The median build fell ${DROP} minutes in ${WEEKS.length} weeks.`;
export const STAT_HEADLINE = `A build now takes ${AFTER} minutes, down from ${BEFORE}.`;

/** The weeks the trend chart shows at each click: before the first change, up to the last, all. */
const firstShipped = CHANGES[0]?.week ?? WEEKS.length;
const lastShipped = CHANGES.at(-1)?.week ?? WEEKS.length;
export const TREND_STEPS = [
  WEEKS.slice(0, firstShipped - 1),
  WEEKS.slice(0, lastShipped - 1),
  WEEKS,
];
/** The weeks after the last change, accented on the chart's last step. */
export const AFTER_LAST_CHANGE = WEEKS.slice(lastShipped - 1).map(({ week }) => week);

/** Median of the week before the last change shipped, rounded: 6. */
export const BEFORE_LAST_CHANGE = Math.round(WEEKS[lastShipped - 2]?.minutes ?? Number.NaN);

export const TREND_SOURCE = "Weekly median CI build, data/build-times.csv. Illustrative figures.";

/** The close on 06-close and 09-close-fitted. */
export const CLOSE_HEADLINE = `Keep the build at ${AFTER} minutes.`;
