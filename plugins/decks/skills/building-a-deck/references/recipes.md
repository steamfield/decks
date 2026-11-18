# Slide recipes

Use this checkout’s CLI, or a Decks build that includes `ChartSteps`, the MDX `Camera` component,
and the `rise` and `iris` presets. Paste one complete MDX block into a file under `slides/` in a
conventional `decks new` deck. The snippets use the scaffold’s kit theme and stylesheet and
include their own demo content. Run `bun run decks dev examples/recipes` from the repository
root to try the fixture.

## Big number

Use this when one measured quantity carries the argument. Show a comparison or a range when the audience needs a benchmark or needs to see uncertainty.

~~~~mdx
---
title: The median wait exceeds half an hour.
---

<Center>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>The median wait exceeds half an hour.</h1>
  <Step at={1}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
      <span style={{ fontSize: "calc(200px * var(--deck-text-scale, 1))", lineHeight: 1, color: "var(--od-cyan-soft)" }}>
        <CountUp at={1} to={42} />
      </span>
      <span className="od-h2">minutes</span>
    </div>
  </Step>
  <small style={{ fontSize: "calc(30px * var(--deck-text-scale, 1))", color: "var(--od-text-secondary)" }}>Demo data · Median wait before routing</small>
</Center>
~~~~

## Ranked bars

Use this when the audience needs to compare several categories and then focus on the leader. Show the complete chart on arrival when the group needs the full ranking to make sense of the first point.

~~~~mdx
---
title: West handles the most requests.
clicks: 2
---

import { ChartSteps, ink, scaleChartTheme, slideChartTheme, theme, useFrameScale } from "@steamfield/decks/kit";

export function RankedBars() {
  const scale = useFrameScale();
  const rows = [
    { desk: "West", requests: 84 },
    { desk: "North", requests: 60 },
    { desk: "East", requests: 36 },
  ];
  const labelColor = theme().text.secondary;
  const specs = [rows.slice(1), rows, rows].map((data, click) => ({
    mark: "bar",
    data,
    encoding: {
      x: { field: "requests", type: "quantitative", scale: { domain: [0, 100] }, axis: { labelColor, tickCount: 5 } },
      y: {
        field: "desk",
        type: "nominal",
        sort: null,
        scale: { domain: rows.map(({ desk }) => desk), reverse: true },
        axis: { labelColor, values: data.map(({ desk }) => desk) },
      },
      key: { field: "desk", type: "nominal" },
      color: {
        condition: { test: { field: "desk", equal: rows[0].desk }, value: ink(click === 2 ? "cyan" : "slate", 3) },
        value: ink("slate", 3),
      },
    },
    legend: { show: false },
    responsive: false,
    watermark: false,
    labels: { density: "all", placement: "outside", fontSize: 38 * scale },
    theme: scaleChartTheme({
      ...slideChartTheme,
      fonts: { ...slideChartTheme.fonts, sizes: { ...slideChartTheme.fonts.sizes, axisTick: 52 } },
    }, scale),
    animation: { enter: false, update: true },
  }));

  return (
    <div style={{ width: "100%", height: 540 }}>
      <ChartSteps specs={specs} at={1} />
    </div>
  );
}

<Cover>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>West handles the most requests.</h1>
  <RankedBars />
  <small style={{ fontSize: "calc(30px * var(--deck-text-scale, 1))", color: "var(--od-text-secondary)" }}>Demo data · Requests by desk during the pilot</small>
</Cover>
~~~~

## Before and after

Use this when two states share a frame of reference and the audience needs to see what changed. Take a sequence of three or more states through a timeline. The `rise` override applies to the boundary with the next slide. Keep it if the next slide continues the sequence.

~~~~mdx
---
title: Routing rules give each request an owner.
transition: rise
---

<h1 className="od-title" style={{ position: "absolute", top: "var(--deck-pad-y)", insetInline: "var(--deck-pad-x)", fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>
  Routing rules give each request an owner.
</h1>

<TwoCol align="center">
  <div>
    <h2 className="od-h2" style={{ fontSize: "calc(42px * var(--deck-text-scale, 1))" }}>Before</h2>
    <div className="od-body" style={{ fontSize: "calc(44px * var(--deck-text-scale, 1))" }}>A dispatcher manually picks a queue.</div>
  </div>
  <Step at={1}>
    <h2 className="od-h2" style={{ fontSize: "calc(42px * var(--deck-text-scale, 1))" }}>After</h2>
    <div className="od-body" style={{ fontSize: "calc(44px * var(--deck-text-scale, 1))" }}>The rules assign an owner at intake.</div>
  </Step>
</TwoCol>
~~~~

## Timeline

Use this when the order of a few dated events explains an outcome. Use a time-scaled chart when the gaps between events are part of the evidence. The `iris` override plays into the next slide in the fixture, where the dispatcher’s quote is revealed.

~~~~mdx
---
title: The pilot ended manual sorting.
transition: iris
---

export function Milestone({ date, children }) {
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  }).format(new Date(date));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "9ch 1fr", gap: 48, paddingBlock: 8 }}>
      <time className="od-mono" dateTime={date} style={{ color: "var(--od-cyan-soft)" }}>{label}</time>
      <span>{children}</span>
    </div>
  );
}

<Cover>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>The pilot ended manual sorting.</h1>
  <Steps from={1} className="od-h2">
    <Milestone date="2025-04-07">Pilot opened.</Milestone>
    <Milestone date="2025-04-14">West joined.</Milestone>
    <Milestone date="2025-04-21">Rules went live.</Milestone>
    <Milestone date="2025-04-28">Manual sorting ended.</Milestone>
  </Steps>
  <small style={{ fontSize: "calc(30px * var(--deck-text-scale, 1))", color: "var(--od-text-secondary)" }}>Demo data · Dispatch pilot milestones</small>
</Cover>
~~~~

## Quote

Use this when a speaker’s wording is itself evidence. Highlight a single phrase after the room has had time to read it. Paraphrase in your own voice when the exact wording adds little.

~~~~mdx
---
title: Dispatchers need to see who owns the next request.
---

<Cover>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>Dispatchers need to see who owns the next request.</h1>
  <figure style={{ margin: 0 }}>
    <blockquote className="od-title" style={{ margin: 0, fontSize: "calc(92px * var(--deck-text-scale, 1))" }}>
      “Show me <Highlight at={1}>who goes next</Highlight>.”
    </blockquote>
    <figcaption style={{ marginTop: 36, fontSize: "calc(30px * var(--deck-text-scale, 1))", color: "var(--od-text-secondary)" }}>
      Demo data · Dispatcher in a simulated handoff
    </figcaption>
  </figure>
</Cover>
~~~~

## Three-step process

Use this when consecutive actions each need a moment of explanation. Show actions together when the audience can perform them in any order.

~~~~mdx
---
title: Dispatch confirms the owner before handoff.
---

<Cover>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>Dispatch confirms the owner before handoff.</h1>
  <Steps from={1} className="od-h2">
    <ol style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 64, width: "100%", padding: 0, listStylePosition: "inside" }}>
      <li>Read the request.</li>
      <li>Pick a route.</li>
      <li>Confirm the owner.</li>
    </ol>
  </Steps>
</Cover>
~~~~

## Diagram tour

Use this when the audience needs the whole diagram for orientation and separate views to read its details. Use a static diagram when all labels are already readable at presentation distance.

~~~~mdx
---
title: Every request passes through a routing desk.
---

<Center>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>Every request passes through a routing desk.</h1>
  <div role="region" aria-label="Routing diagram" style={{ width: 920, height: 480, background: "var(--od-surface)" }}>
    <Camera at={1} stops={[
      { x: 460, y: 240, zoom: 1 },
      { x: 240, y: 150, zoom: 1.35 },
      { x: 460, y: 240, zoom: 1.35 },
      { x: 680, y: 340, zoom: 1.35 },
    ]}>
      <svg width="920" height="480" viewBox="0 0 920 480" role="img" aria-label="Request flow from intake to dispatch" style={{ display: "block" }}>
        <desc>Web and phone requests meet at intake, pass through the routing desk, and leave dispatch in the general or priority queue.</desc>
        <g fill="none" stroke="var(--od-text-muted)" strokeWidth="3">
          <path d="M60 65V105H240V115M60 225V195H240V185M340 150H370V240H395M525 240H555V340H580M780 340H820V265H860M780 340H820V415H860" />
        </g>
        <g fill="var(--od-canvas)" stroke="var(--od-cyan-soft)" strokeWidth="3">
          <rect x="140" y="115" width="200" height="70" rx="12" />
          <rect x="395" y="195" width="130" height="90" rx="12" />
          <rect x="580" y="305" width="200" height="70" rx="12" />
        </g>
        <g fill="var(--od-text)" textAnchor="middle" dominantBaseline="central" style={{ fontSize: "calc(42px * var(--deck-text-scale, 1))" }}>
          <text x="240" y="150">Intake</text>
          <text x="460" y="240">Rules</text>
          <text x="680" y="340">Dispatch</text>
        </g>
        <g fill="var(--od-text)" textAnchor="middle" dominantBaseline="central" style={{ fontSize: "calc(30px * var(--deck-text-scale, 1))" }}>
          <text x="60" y="48">Web</text>
          <text x="60" y="245">Phone</text>
          <text x="860" y="247">Priority</text>
          <text x="860" y="435">General</text>
        </g>
      </svg>
    </Camera>
  </div>
</Center>
~~~~

## Code walkthrough

Use this when successive edits to the same snippet explain a change in behavior. Put two independent implementations side by side for direct comparison.

~~~~mdx
---
title: Urgent requests take the priority route.
---

<Cover>
  <h1 className="od-title" style={{ fontSize: "calc(64px * var(--deck-text-scale, 1))" }}>Urgent requests take the priority route.</h1>
  <div style={{ width: "100%" }}>

````md magic-move "route.ts"
```ts
const queue = "general";
```

```ts {1}
const queue = request.urgent ? "priority" : "general";
```

```ts {all}
const queue = request.urgent ? "priority" : "general";
dispatch(queue, request);
```
````

  </div>
</Cover>
~~~~
