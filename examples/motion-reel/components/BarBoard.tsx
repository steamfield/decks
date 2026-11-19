import {
  ChartSteps,
  ink,
  scaleChartTheme,
  slideChartTheme,
  theme,
  useFrameScale,
  useTemplateMotion,
} from "@steamfield/decks/kit";
import { duration } from "@steamfield/decks/motion";
import { type ComponentProps, useMemo, useRef } from "react";
import styles from "./BarBoard.module.css";
import { CLEAR, slam, snap } from "./ease";

type Specs = ComponentProps<typeof ChartSteps>["specs"];

/**
 * A ranked bar chart on the reel's terms. Click 1 wipes the board across the canvas while its
 * bars grow from zero; click 2 turns the leading bar to the signal colour and dims the rest.
 * The bars are an OpenChart spec stepped by `ChartSteps`; the wipe and the source line are the
 * reel's own.
 */
export function BarBoard({
  rows,
  source,
}: {
  rows: readonly { group: string; templates: number }[];
  source: string;
}) {
  const board = useRef<HTMLDivElement>(null);
  const credit = useRef<HTMLParagraphElement>(null);
  const scale = useFrameScale();
  const specs = useMemo<Specs>(() => {
    const lead = rows[0]?.group ?? "";
    const top = Math.max(...rows.map((row) => row.templates));
    const label = theme().text.primary;
    const base = scaleChartTheme(
      {
        ...slideChartTheme,
        fonts: {
          ...slideChartTheme.fonts,
          sizes: { ...slideChartTheme.fonts.sizes, axisTick: 50 },
        },
      },
      scale,
    );
    return [0, 1, 2].map((step) => ({
      mark: { type: "bar" as const, cornerRadius: 0 },
      data: rows.map((row) => ({ ...row, templates: step === 0 ? 0 : row.templates })),
      encoding: {
        x: {
          field: "templates",
          type: "quantitative" as const,
          // Bars start at zero; the ceiling leaves room for the value beside the longest bar.
          scale: { domain: [0, Math.ceil((top * 1.15) / 2) * 2] },
          axis: { labelColor: theme().text.muted, tickCount: 4 },
        },
        y: {
          field: "group",
          type: "nominal" as const,
          sort: null,
          scale: { domain: rows.map((row) => row.group), reverse: true, paddingInner: 0.18 },
          axis: { labelColor: label },
        },
        key: { field: "group", type: "nominal" as const },
        color: {
          condition: {
            test: { field: "group", equal: lead },
            value: step === 2 ? ink("amber", 3) : label,
          },
          value: step === 2 ? ink("slate", 1) : label,
        },
      },
      legend: { show: false },
      responsive: false,
      watermark: false,
      labels: { density: "all" as const, placement: "outside" as const, fontSize: 50 * scale },
      theme: base,
      animation: { enter: false, update: true },
    }));
  }, [rows, scale]);

  useTemplateMotion(1, (tl) => {
    tl.fromTo(
      board.current,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: duration.slow, ease: slam },
      0,
    );
    tl.fromTo(
      credit.current,
      { yPercent: CLEAR },
      { yPercent: 0, duration: duration.slow, ease: snap },
      duration.quick,
    );
  });

  return (
    <figure className={styles.figure}>
      <div className={styles.board} ref={board}>
        <ChartSteps specs={specs} at={1} />
      </div>
      <figcaption className={styles.source}>
        <p ref={credit}>{source}</p>
      </figcaption>
    </figure>
  );
}
