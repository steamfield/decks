/// <reference types="vite/client" />
// Illustrative data for a fictional platform team: the three build changes, the week each
// shipped and the minutes it saved per build, read from ./changes.csv. Not a measurement of any
// real team. See ../data-sources.md, slides 05-changes and 08-saved.
import csv from "./changes.csv?raw";

/** One row per change of changes.csv, in the order they shipped. */
export const CHANGES = csv
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [label = "", week, saved] = line.split(",");
    return { label, week: Number(week), saved: Number(saved) };
  });

/** Minutes saved per build by all three changes together: 10. */
export const TOTAL_SAVED = CHANGES.reduce((sum, { saved }) => sum + saved, 0);

export const CHANGES_HEADLINE = `${CHANGES.length} changes took ${TOTAL_SAVED} minutes off every build.`;

/** bar-board rows: minutes saved per change, largest first, as the template requires. */
export const SAVED_ROWS = CHANGES.map(({ label, saved }) => ({ label, value: saved })).sort(
  (a, b) => b.value - a.value,
);

const leader = SAVED_ROWS[0];
if (!leader) throw new Error(`changes.csv has no rows: "${csv}"`);

export const SAVED_HEADLINE = `${leader.label} saved ${leader.value} of the ${TOTAL_SAVED} minutes.`;

export const SAVED_SOURCE = "Minutes saved per build, data/changes.csv. Illustrative.";
