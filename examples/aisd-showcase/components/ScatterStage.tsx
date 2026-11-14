import type { LayerSpec, MarkEvent, PointEncoding } from "@opendata-ai/openchart-react";
import {
  ink,
  OpenChart,
  StoryCard,
  StoryLink,
  StoryStage,
  slideChartAnimation,
  theme,
  useStage,
} from "@steamfield/decks/kit";
import { useState } from "react";
import { scatterPoints } from "../data/09-scatter";
import { useAisdChartTheme } from "../styles/chart-theme";
import { CampusHoverCard } from "./CampusHoverCard";
import { SCATTER_DIM, SCATTER_IMPROVED } from "./palette";
import styles from "./ScatterStage.module.css";

const BACKDROP_TIER = "Other D/F campus";
const TIER_DOMAIN = ["Crossed the fifth F", "One F from the trigger", BACKDROP_TIER];
const IMPROVED = scatterPoints.filter((p) => p.y > p.x).length;
const DECLINED = scatterPoints.filter((p) => p.y < p.x).length;
const UNCHANGED = scatterPoints.length - IMPROVED - DECLINED;
const COPY = [
  {
    lead: `${IMPROVED} of ${scatterPoints.length} had higher pass rates.`,
    body: `${DECLINED} declined; ${UNCHANGED} was unchanged. Above the line means a higher STAAR pass rate in 2026.`,
  },
  {
    lead: "Two crossed. Amber is one F away.",
    body: "Six amber campuses closed; their records moved to the schools that took their students.",
  },
  { lead: "Six campuses got worse.", body: "Below the diagonal, slipping backward." },
];
const plotPoints = scatterPoints.map(({ campusNumber, campus, x, y, tier }) => ({
  campusNumber,
  campus,
  x,
  y,
  tier,
}));
const backdropPoints = plotPoints.filter((point) => point.tier === BACKDROP_TIER);
const highlightedPoints = plotPoints.filter((point) => point.tier !== BACKDROP_TIER);

export function ScatterStage() {
  const { chartTheme, chartScale } = useAisdChartTheme();
  const { clicks, isActive, copy, beats } = useStage({
    copy: COPY,
    beats: (_tl, beat) => {
      beat(0);
      beat(1);
      beat(2);
    },
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visit, setVisit] = useState({ clicks, isActive });
  if (visit.clicks !== clicks || visit.isActive !== isActive) {
    setVisit({ clicks, isActive });
    setSelectedId(null);
  }
  const selected = scatterPoints.find((point) => point.campusNumber === selectedId);
  const showCampus = (event: MarkEvent) =>
    setSelectedId(typeof event.datum.campusNumber === "string" ? event.datum.campusNumber : null);
  const tierRange = [
    [ink("rose", 3), ink("amber", 2), ink("slate", 1)],
    [ink("rose", 3), ink("amber", 2), SCATTER_DIM],
    [SCATTER_DIM, ink("amber", 2), ink("slate", 2)],
  ];
  const beatAnnotations: LayerSpec["annotations"][] = [
    [
      {
        type: "text",
        x: 28,
        y: 62,
        text: "Improved",
        fill: SCATTER_IMPROVED,
        fontSize: 26 * chartScale,
        connector: false,
      },
    ],
    [],
    [
      {
        type: "text",
        x: 56,
        y: 27,
        text: "Slipped",
        fill: ink("rose", 3),
        fontSize: 26 * chartScale,
        connector: false,
      },
    ],
  ];
  const encoding: PointEncoding = {
    color: {
      field: "tier",
      type: "nominal",
      scale: { domain: TIER_DOMAIN, range: tierRange[clicks] ?? tierRange[0] },
    },
    x: {
      field: "x",
      type: "quantitative",
      axis: {
        title: "Spring 2025 pass rate",
        format: ".0f%",
        tickCount: 5,
        labelColor: theme().text.muted,
      },
      scale: { domain: [23, 73], nice: false },
    },
    y: {
      field: "y",
      type: "quantitative",
      axis: {
        title: "Spring 2026 pass rate",
        format: ".0f%",
        tickCount: 5,
        labelColor: theme().text.muted,
      },
      scale: { domain: [23, 73], nice: false },
    },
  };
  const scatterSpec: LayerSpec = {
    encoding,
    layer: [
      {
        mark: { type: "rule", stroke: ink("slate", 2), strokeWidth: 2, tooltip: null },
        data: [{ x: 23, y: 23, x2: 73, y2: 73, tier: BACKDROP_TIER, campus: "No change" }],
        encoding: {
          x2: { field: "x2", type: "quantitative" },
          y2: { field: "y2", type: "quantitative" },
        },
      },
      {
        mark: {
          type: "point",
          filled: true,
          tooltip: null,
          size: 6 * chartScale,
          trendline: false,
        },
        data: backdropPoints,
        encoding,
      },
      {
        mark: {
          type: "point",
          filled: true,
          tooltip: null,
          size: 12 * chartScale,
          trendline: false,
        },
        data: highlightedPoints,
        encoding,
      },
    ],
    annotations: [
      {
        type: "text",
        x: 61,
        y: 61,
        text: "No change: 2026 = 2025",
        fill: ink("slate", 3),
        fontSize: 20 * chartScale,
        offset: { dx: 0, dy: 32 },
        connector: false,
      },
      ...(beatAnnotations[clicks] ?? beatAnnotations[0] ?? []),
    ],
    chrome: {
      subtitle: "Each dot: an AISD campus with three straight D/F ratings, 2022-23 to 2024-25.",
      source: "Source: TEA STAAR Cambium campus data",
    },
    legend: { position: "top" },
    theme: chartTheme,
    animation: slideChartAnimation,
  };
  return (
    <StoryStage
      fluid
      beats={beats}
      click={clicks}
      overlay={
        <>
          <h2 className="od-story-head">
            {IMPROVED} of {scatterPoints.length} had higher STAAR pass rates.
          </h2>
          <section
            aria-label="Campus pass rate scatter plot"
            className={styles.chart}
            onMouseLeave={() => setSelectedId(null)}
          >
            <OpenChart
              spec={scatterSpec}
              onMarkHover={showCampus}
              onMarkLeave={() => setSelectedId(null)}
            />
          </section>
          <CampusHoverCard
            className={styles.tooltip}
            campus={selected?.metadata}
            consecutiveFs={selected?.consecutiveFs ?? 0}
            rates={selected}
            closed={selected?.closed}
            recordMovedTo={selected?.recordMovedTo}
          />
          <div className={styles.hint}>Hover a dot for campus details.</div>
          <StoryLink
            href="https://tryopendata.ai/datasets/tea/staar-cambium-campus"
            label="Source: TEA STAAR campus data via OpenData"
          />
        </>
      }
      card={
        <div style={{ display: selected ? "none" : undefined }}>
          <StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />
        </div>
      }
    />
  );
}
