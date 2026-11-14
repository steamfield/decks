import {
  DRAW,
  DUR,
  ink,
  OpenChart,
  SETTLE,
  STAGE,
  StoryCard,
  StoryStage,
  scaleChartTheme,
  slideChartAnimation,
  slideChartTheme,
  stagger,
  useFrameScale,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { type ComponentProps, useMemo } from "react";
import {
  BAD_EXCERPT,
  ENGINE_VERSION,
  FIXED,
  FIXED_EXCERPT,
  PACKAGES,
  README_SPEC,
  SPEC_LABEL,
  TYPO_LINE,
  VERDICT,
} from "../data/16-openchart";
import { CodePane } from "./CodePane";
import { DIM, OFF, ON } from "./design";
import { NamePlate } from "./NamePlate";
import styles from "./OpenChartStage.module.css";
import { ThreadRail } from "./ThreadRail";

const COPY = [
  {
    lead: "A chart is a JSON spec.",
    body: "The spec names a mark and maps data columns to x and y. The engine computes the layout.",
  },
  {
    lead: "The error names the misspelled field.",
    body: "It has a JSON Pointer path, an error code, and a suggestion with the closest column name.",
  },
  {
    lead: "With the field corrected, the spec validates.",
    body: "validateSpec returns no errors and the Vue component draws the chart.",
  },
  {
    lead: "Drawing is a separate package from the engine.",
    body: "vanilla draws the engine's layout to the DOM. The React, Vue and Svelte packages wrap vanilla.",
  },
];

const CODE = { x: 110, y: 196, width: 690, height: 504 };
const TILE = { x: 826, y: 196, width: 440, height: 504 };
const CHART = { x: 1292, y: 196, width: 518, height: 504 };
const LIST = { x: 850, y: 728, row: 36, name: 0, bar: 150, barMax: 470, barHeight: 18, gap: 16 };
const widest = Math.max(...PACKAGES.map((p) => p.lines));
const rows = PACKAGES.map((p, i) => ({
  ...p,
  y: LIST.y + 34 + i * LIST.row,
  width: Math.max(3, (p.lines / widest) * LIST.barMax),
  count: p.lines.toLocaleString("en-US"),
  top: p.lines === widest,
}));

const DATA = ink("cyan", 2);
const NEUTRAL = ink("slate", 1);
const place = (box: { x: number; y: number; width: number; height: number }) => ({
  left: `${(box.x / STAGE.width) * 100}%`,
  top: `${(box.y / STAGE.height) * 100}%`,
  width: `${(box.width / STAGE.width) * 100}%`,
  height: `${(box.height / STAGE.height) * 100}%`,
});
const labelBox = { left: place(CODE).left, top: place(CODE).top, width: place(CODE).width };

export function OpenChartStage() {
  const s = useTween({ frame: OFF, verdict: OFF, chart: OFF, list: OFF });
  const { clicks, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { frame: ON, duration: DUR.grow, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { verdict: ON, duration: DUR.card, ease: SETTLE });
      beat(1);
      tl.to(s, { chart: ON, duration: DUR.card, ease: SETTLE });
      beat(2);
      tl.to(s, { list: ON, duration: DUR.scale, ease: DRAW });
      beat(3);
    },
  });
  const phase = clicks < 1 ? "idle" : clicks < 2 ? "bad" : "ok";
  const excerpt = phase === "ok" ? FIXED_EXCERPT : BAD_EXCERPT;
  const focus = useMemo<readonly (readonly [number, number])[]>(
    () => (clicks === 1 || clicks === 2 ? [[TYPO_LINE, TYPO_LINE]] : []),
    [clicks],
  );
  const back = ON - s.list * (ON - DIM);
  const rowProgress = (i: number) => stagger(s.list, i, rows.length, 0.12);
  const scale = useFrameScale();
  const chartSpec = useMemo<ComponentProps<typeof OpenChart>["spec"]>(() => {
    const base = scaleChartTheme(
      {
        ...slideChartTheme,
        fonts: {
          ...slideChartTheme.fonts,
          sizes: {
            ...slideChartTheme.fonts.sizes,
            subtitle: 24,
            body: 24,
            small: 21,
            axisTick: 24,
          },
        },
      },
      scale,
    );
    return {
      ...README_SPEC,
      data: [...README_SPEC.data],
      theme: { ...base, colors: { ...base.colors, categorical: [DATA] } },
      animation: slideChartAnimation,
      labels: { density: "none" },
    };
  }, [scale]);

  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <g style={{ opacity: s.list }}>
          <text className="sf-pixel is-small" x={LIST.x} y={LIST.y + 8}>
            Lines of TypeScript, excluding tests
          </text>
          {rows.map((row, i) => (
            <g key={row.name} style={{ opacity: rowProgress(i) }}>
              <text
                className="sf-mono"
                x={LIST.x + LIST.name}
                y={row.y + 6}
                style={{ fill: row.top ? DATA : undefined }}
              >
                {row.name}
              </text>
              <rect
                x={LIST.x + LIST.bar}
                y={row.y - LIST.barHeight + 6}
                width={row.width * rowProgress(i)}
                height={LIST.barHeight}
                rx="2"
                fill={row.top ? DATA : NEUTRAL}
              />
              <text
                className="sf-mono is-small"
                x={LIST.x + LIST.bar + row.width + LIST.gap}
                y={row.y + 5}
              >
                {row.count} · {row.role}
              </text>
            </g>
          ))}
        </g>
      }
      overlay={
        <>
          <h2 className="od-story-head">OpenChart validation reports which field is wrong.</h2>
          <NamePlate id="openchart" />
          <div className={`oc-spec ${styles["oc-spec"]} is-${phase}`}>
            <CodePane
              excerpt={excerpt}
              focus={focus}
              progress={s.frame * back}
              {...CODE}
              size={21}
            />
            <div
              className={`oc-spec-label ${styles["oc-spec-label"]}`}
              style={{ ...labelBox, opacity: s.frame * back }}
            >
              {SPEC_LABEL}
            </div>
          </div>
          <div
            className={`oc-verdict ${styles["oc-verdict"]} is-${phase}`}
            style={{ ...place(TILE), opacity: s.frame * back }}
          >
            <div className={`oc-verdict-head ${styles["oc-verdict-head"]}`}>validateSpec(spec)</div>
            <div className={`oc-verdict-run ${styles["oc-verdict-run"]}`}>
              engine {ENGINE_VERSION}, run in this page
            </div>
            {phase === "bad" ? (
              <dl
                className={`oc-verdict-rows ${styles["oc-verdict-rows"]}`}
                style={{ opacity: s.verdict }}
              >
                <dt>valid</dt>
                <dd className="is-state">false</dd>
                <dt>path</dt>
                <dd>{VERDICT.path}</dd>
                <dt>code</dt>
                <dd>{VERDICT.code}</dd>
                <dt>suggestion</dt>
                <dd className="is-prose">{VERDICT.suggestion}</dd>
              </dl>
            ) : phase === "ok" ? (
              <dl className={`oc-verdict-rows ${styles["oc-verdict-rows"]}`}>
                <dt>valid</dt>
                <dd className="is-state">{String(FIXED.valid)}</dd>
                <dt>errors</dt>
                <dd>{FIXED.errors}</dd>
              </dl>
            ) : null}
          </div>
          <div className={`oc-chart ${styles["oc-chart"]}`} style={place(CHART)}>
            {s.chart > OFF && (
              <div style={{ width: "100%", height: "100%", opacity: s.chart }}>
                <OpenChart spec={chartSpec} />
              </div>
            )}
          </div>
          <ThreadRail current="openchart" />
        </>
      }
      card={<StoryCard anchor="left" hue="rose" lead={copy.lead} body={copy.body} />}
    />
  );
}
