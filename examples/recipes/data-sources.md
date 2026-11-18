# Slide recipes data provenance

The dispatch pilot is fictional. The recipes embed the display values so each MDX block
can be pasted into a fresh conventional deck by itself.

Run this query from the repository root to reproduce the figures from the demo records.

```sh
bun -e 'import { waitMinutes, requestsByDesk, milestones } from "./examples/recipes/data/dispatch-pilot.ts"; console.log(JSON.stringify({ medianWaitMinutes: waitMinutes.toSorted((a, b) => a - b)[Math.floor(waitMinutes.length / 2)], requestsByDesk, milestones }, null, 2))'
```

| Slide | Demo result | Scope |
| --- | --- | --- |
| `01-big-number` | 42 minutes | Median elapsed time from request intake to routing in a sample of five pilot requests. |
| `02-ranked-bars` | West 84, North 60, East 36 | Total requests handled by each desk over the simulated April pilot. |
| `03-before-after` | Manual assignment and assignment by rule | Illustrative workflow states. |
| `04-timeline` | Apr 7, Apr 14, Apr 21, Apr 28 | Pilot milestones in April 2025. The slide displays the UTC calendar dates. |
| `05-quote` | “Show me who goes next.” | Original dialogue written for the simulated dispatcher. |
| `06-three-steps` | Read, route, confirm | Illustrative handoff procedure. |
| `07-diagram-tour` | Intake, routing rules, dispatch | Illustrative flow through the desk. |
| `08-code-walkthrough` | General and priority routes | Illustrative source code for the same workflow. |
