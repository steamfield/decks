---
theme: the-unnamed
title: "Slide Templates"
info: "Reference templates for conventional Decks slides: cover, bullets, two columns, big stats, a chart and a story stage."
author: Decks
transition: slide-left
aspectRatio: 16/9
canvasWidth: 1920
fonts:
  fallbacks: false
  webfonts: [Inter]
  sans: Inter, sans-serif
  serif: Inter, sans-serif
  mono: Inter, sans-serif
  weights: "300,400,510,590,700"
lineNumbers: false
drawings:
  enabled: false
defaults:
  layout: full
addons: ["slidev-addon-decks"]
exportFilename: od-slide-templates
---

<!--
TEMPLATE 1 · COVER / TITLE
Deepest-black canvas, restrained accent on the overline rule.
Use for deck openers. Swap eyebrow, title, lede, and meta row.
-->

<div class="od-slide is-cover">
  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div class="od-brand">
      <OdLogo :size="34" />
      <span class="od-brand-name">Your brand</span>
    </div>
    <span class="od-mono" style="font-size:1rem; color:var(--od-text-dim); letter-spacing:0.02em;">example.com</span>
  </div>

  <div style="max-width:70vw;">
    <div style="display:flex; align-items:center; gap:0.9rem; margin-bottom:1.7rem;">
      <span class="od-eyebrow-rule"></span>
      <span class="od-eyebrow">Annual review</span>
    </div>
    <h1 class="od-title">Ridership is back above 2019</h1>
    <p class="od-lede" style="margin:1.7rem 0 0; max-width:56vw;">A sample deck for a city transit team: what changed this year, what it cost, and what the network needs next.</p>
  </div>

  <div class="od-mono" style="display:flex; align-items:center; gap:1.5rem; font-size:0.95rem; color:var(--od-text-faint);">
    <span>Planning Team</span>
    <span style="color:var(--od-text-dim);">&bull;</span>
    <span>June 2026</span>
    <span style="color:var(--od-text-dim);">&bull;</span>
    <span>v1.0</span>
  </div>
</div>

---
---

<!--
TEMPLATE 2 · CONTENT + BULLETS
2x2 grid of icon-tile + heading + one line. Lucide-style stroked
icons in accent-tinted tiles (cyan / violet / emerald / blue).
-->

<div class="od-slide">
  <div style="margin-bottom:1.1rem;"><span class="od-eyebrow">Priorities</span></div>
  <h2 class="od-h2" style="margin-bottom:3.2rem;">What the team ships this year</h2>

  <div class="od-grid-2x2">
    <div class="od-tile tint-cyan">
      <div class="od-tile-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
      </div>
      <div>
        <h3>Find</h3>
        <p>Search every route, stop and timetable change in one place.</p>
      </div>
    </div>
    <div class="od-tile tint-violet">
      <div class="od-tile-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
      </div>
      <div>
        <h3>Track</h3>
        <p>Every timetable is versioned. Compare two revisions side by side.</p>
      </div>
    </div>
    <div class="od-tile tint-emerald">
      <div class="od-tile-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
      </div>
      <div>
        <h3>Measure</h3>
        <p>Read ridership by route and hour without exporting a spreadsheet.</p>
      </div>
    </div>
    <div class="od-tile tint-blue">
      <div class="od-tile-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
      </div>
      <div>
        <h3>Connect</h3>
        <p>Line ridership up with weather and events on the dates they share.</p>
      </div>
    </div>
  </div>

  <OdFooter />
</div>

---
---

<!--
TEMPLATE 3 · TWO-COLUMN (TEXT + VISUAL)
Left: descriptive text + meta chips. Right: a product surface
(here a schema table card). Good for feature deep-dives.
-->

<div class="od-slide">
  <div class="od-twocol">
    <div>
      <span class="od-eyebrow">Dataset</span>
      <h2 class="od-h2" style="margin:1.1rem 0 0.9rem;">Producer Price Index &mdash; Pharmaceuticals</h2>
      <div class="od-dataset-id" style="margin-bottom:1.6rem;">sample/ppi-pharma</div>
      <p style="margin:0 0 2rem; font-size:1.15rem; line-height:1.55; color:var(--od-text-secondary); max-width:34vw;">What do drug manufacturers actually get paid for prescription medicines? This series tracks monthly producer prices for human pharmaceutical preparations, indexed to 1982 = 100.</p>
      <div class="od-chips">
        <span class="od-chip"><span class="od-chip-badge" style="background:oklch(70% 0.15 300);">F</span>FRED</span>
        <span class="od-chip mono">1.1k rows</span>
        <span class="od-chip">Updated yesterday</span>
        <span class="od-chip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
          181
        </span>
      </div>
    </div>
    <div class="od-card">
      <div class="od-card-head">
        <span style="font-size:1.05rem; font-weight:510;">Schema</span>
        <span class="od-mono" style="font-size:0.8rem; color:var(--od-text-faint);">4 columns</span>
      </div>
      <div class="od-schema-row od-schema-head" style="border-bottom:1px solid var(--od-border-subtle);">
        <span>Column</span><span>Type</span><span>Description</span>
      </div>
      <div class="od-schema-row">
        <span class="od-schema-col">date</span>
        <span class="od-schema-type">date</span>
        <span class="od-schema-desc">Observation month</span>
      </div>
      <div class="od-schema-row">
        <span class="od-schema-col">value</span>
        <span class="od-schema-type">float</span>
        <span class="od-schema-desc">Price index (1982 = 100)</span>
      </div>
      <div class="od-schema-row">
        <span class="od-schema-col">series_id</span>
        <span class="od-schema-type">string</span>
        <span class="od-schema-desc">FRED series identifier</span>
      </div>
      <div class="od-schema-row">
        <span class="od-schema-col">footnote</span>
        <span class="od-schema-type">string</span>
        <span class="od-schema-desc">Revision / methodology note</span>
      </div>
    </div>
  </div>

  <OdFooter />
</div>

<style>
/* The meta chips and the schema card on this slide only. */
.od-dataset-id {
  font-family: var(--od-font-mono);
  font-size: 0.95rem;
  color: var(--od-text-faint);
}
.od-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.od-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--od-border);
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--od-text-secondary);
}
.od-chip.mono {
  font-family: var(--od-font-mono);
}
.od-chip-badge {
  display: inline-grid;
  place-items: center;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--od-canvas);
}
.od-card {
  border: 1px solid var(--od-border);
  border-radius: 12px;
  background: var(--od-surface);
  padding: 1.4rem 1.6rem;
}
.od-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
}
.od-schema-row {
  display: grid;
  grid-template-columns: 9rem 6rem 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--od-border-subtle);
  font-size: 1rem;
}
.od-schema-row:last-child {
  border-bottom: none;
}
.od-schema-head {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--od-text-faint);
}
.od-schema-col {
  font-family: var(--od-font-mono);
  color: var(--od-text);
}
.od-schema-type {
  font-family: var(--od-font-mono);
  color: var(--od-cyan);
}
.od-schema-desc {
  color: var(--od-text-muted);
}
</style>

---
---

<!--
TEMPLATE 4 · BIG STAT / METRIC
Four large mono numbers, divided by hairlines, each with a label
and a small delta. Numbers stay off-white; accent is reserved for
the deltas.
-->

<div class="od-slide">
  <span class="od-eyebrow">By the numbers</span>
  <h2 class="od-h2" style="margin:1.1rem 0 0;">The year at a glance</h2>

  <div class="od-stats">
    <div class="od-stat">
      <div class="od-stat-num"><RollingNumber value="41M" /></div>
      <div class="od-stat-label">rides this year</div>
      <div class="od-stat-delta up">+12% on last year</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num"><RollingNumber value="214" /></div>
      <div class="od-stat-label">routes in service</div>
      <div class="od-stat-delta up">+6 added</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num"><RollingNumber value="2.3M" /></div>
      <div class="od-stat-label">rides, busiest month</div>
      <div class="od-stat-delta flat">October</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num"><RollingNumber value="96.4" /><span class="unit">%</span></div>
      <div class="od-stat-label">on-time departures</div>
      <div class="od-stat-delta flat">last 90 days</div>
    </div>
  </div>

  <OdFooter />
</div>

---
---

<!--
TEMPLATE 5 · CHART / DATA-VIZ
A full-chrome OpenChart showcase. Unlike templates 1–4 (which build their
chrome in slide HTML), this slide hands the entire editorial surface to
OpenChart: eyebrow, title, subtitle, a KPI metric row, source + byline +
brand, a crosshair, a shaded range band, a threshold reference line, two
text callouts with dots, per-point dots, and the shared slide theme — all
animated on entrance. Copy the spec as a reference for the library's full
feature set.
-->

<div class="od-slide is-chart">
  <div class="od-chart-host od-chart-host--full">
    <OpenChart :spec="ppiChartSpec" />
  </div>

  <OdFooter />
</div>

<script setup lang="ts">
import { slideChartTheme, slideChartAnimation } from 'slidev-addon-decks/chart-theme'
import { ink } from 'slidev-addon-decks/story'
import { theme } from 'slidev-addon-decks/theme'

// PPI for pharmaceutical preparations, indexed to 1982 = 100.
// ~quarterly resolution keeps the series under the data-resolution budget
// while preserving the post-2021 climb the narrative calls out.
const ppiData = [
  { date: '2019-01', value: 126 }, { date: '2019-04', value: 127 },
  { date: '2019-07', value: 128 }, { date: '2019-10', value: 129 },
  { date: '2020-01', value: 129 }, { date: '2020-04', value: 131 },
  { date: '2020-07', value: 133 }, { date: '2020-10', value: 135 },
  { date: '2021-01', value: 134 }, { date: '2021-04', value: 136 },
  { date: '2021-07', value: 138 }, { date: '2021-10', value: 141 },
  { date: '2022-01', value: 143 }, { date: '2022-04', value: 146 },
  { date: '2022-07', value: 145 }, { date: '2022-10', value: 149 },
  { date: '2023-01', value: 152 }, { date: '2023-04', value: 155 },
  { date: '2023-07', value: 158 }, { date: '2023-10', value: 161 },
  { date: '2024-01', value: 164 }, { date: '2024-07', value: 170 },
  { date: '2025-01', value: 174 }, { date: '2025-07', value: 178 },
]

const ppiChartSpec = {
  mark: {
    type: 'area',
    interpolate: 'monotone',
    point: true,
    stroke: ink('cyan', 3),
    strokeWidth: 2.5,
    fill: {
      gradient: 'linear',
      x1: 0, y1: 0, x2: 0, y2: 1,
      stops: [
        { offset: 0, color: ink('cyan', 2), opacity: 0.34 },
        { offset: 0.55, color: ink('cyan', 2), opacity: 0.1 },
        { offset: 1, color: ink('cyan', 2), opacity: 0 },
      ],
    },
  },
  data: ppiData,
  encoding: {
    x: {
      field: 'date',
      type: 'temporal',
      axis: { format: '%Y', labelColor: theme.text.dim },
      scale: { nice: false },
    },
    y: {
      field: 'value',
      type: 'quantitative',
      scale: { domain: [115, 188], zero: false },
      axis: { format: '~s', labelColor: theme.text.dim, title: '' },
    },
  },

  // ── Full editorial chrome (the slide adds none of its own) ──
  chrome: {
    eyebrow: 'Time series · FRED',
    title: 'Pharmaceutical prices climbed 38% through the supply shock',
    subtitle: 'Producer Price Index for human pharmaceutical preparations, indexed to 1982 = 100',
    source: 'Source: FRED, Bureau of Labor Statistics',
    byline: 'Sample deck · FRED PPI',
    brand: 'Decks',
  },

  // ── KPI metric row (renders between subtitle and chart) ──
  metrics: [
    { label: 'Latest (Jul 2025)', value: '178.0', delta: '+2.3%', deltaTone: 'up' },
    { label: 'Since 2019', value: '+38%', delta: 'fastest on record', deltaTone: 'up' },
    { label: 'Series span', value: '2019–2025', secondary: '24 obs' },
  ],

  // ── Interaction: vertical crosshair snaps to the nearest point ──
  crosshair: true,

  legend: { show: false },
  labels: { density: 'none' },

  // ── Shared slide theme, with a per-slide categorical override ──
  theme: {
    ...slideChartTheme,
    colors: { ...slideChartTheme.colors, categorical: [ink('cyan', 3)] },
  },

  // ── Annotation layer: range band, threshold refline, two callouts ──
  annotations: [
    {
      // Shaded period covering the post-2021 supply shock
      type: 'range',
      x1: '2021-04', x2: '2022-10',
      label: 'Supply shock',
      fill: ink('amber', 2),
      opacity: 0.1,
      labelAnchor: 'top',
    },
    {
      // Threshold reference line at the 1982-base doubling point
      type: 'refline',
      y: 150,
      label: '150 — pre-2023 ceiling',
      style: 'dashed',
      stroke: 'rgba(255,255,255,0.28)',
    },
    {
      type: 'text',
      x: '2021-01', y: 134,
      text: 'Prices inflect',
      subtitle: 'Q1 2021',
      anchor: 'bottom',
      offset: { dx: -8, dy: 64 },
      connector: true,
      dot: true,
    },
    {
      type: 'text',
      x: '2025-07', y: 178,
      text: 'Highest on record',
      anchor: 'top',
      offset: { dx: -24, dy: -46 },
      connector: true,
      dot: true,
    },
  ],

  animation: slideChartAnimation,
}
</script>

<!--
This slide is the OpenChart feature showcase. The entire chrome (eyebrow,
title, subtitle, KPI metric row, source, byline, brand) comes from the spec,
not slide HTML — so it doubles as a reference for the library's surface. It
also demonstrates the editorial layer (range band, dashed threshold refline,
two text callouts with dots), per-point dots, a hover crosshair, the shared
slide theme (with a per-slide categorical override via spread), and the
staggered entrance animation. The OpenChart.vue wrapper forces
dark mode and replays the animation each time you navigate back to the slide.
To adapt: swap `ppiData` and edit the chrome/annotations to fit your story.
-->

---
clicks: 2
---

<!--
TEMPLATE 7 · STORY SLIDE (PINNED VISUALIZATION + BEATS)
One full-bleed visualization whose state animates from beat to beat on the
arrow keys, with a floating prose card that swaps its copy per beat. This is
the data-storytelling pattern from `opendata-pitch`: the stage is a
1920x1080 svg, the beat timeline is a pure function of Slidev's $clicks (seek
on entry and on jumps, tween on a single step, so reverse plays the erase for
free), and every duration reads a DUR constant. Marks default to the clean
stroked style; set STORY_STYLE.ink = 'marker' in the addon's story/style.ts for the
hand-inked look. Declare `clicks: beats - 1` in the manifest stanza.

The slide is one component, `components/StoryMinimalStage.vue`, which is the
whole pattern at its smallest: `useStage` with copy, an enter motion and a
beat script; an InkLine drawn on a beat; an InkRule in a StoryLayer; one
InkChip; one StoryCard. Copy that file to start a stage, or let
`bun run new <alias> <dir> --story` do it. The library reference, including
the cross-slide hand-off this deck does not exercise, is
`packages/decks/story/README.md`.

This template deck carries the conventional headmatter, so nothing here
morphs across slides. A real story deck sets the story headmatter instead:
the `od-cut` transition and the story marker attribute, which is also the
signal the guard tests scan a deck by. `bun run new --story` writes it, and
`examples/od-story-templates` is the gallery that runs on it.
-->

<StoryMinimalStage />
