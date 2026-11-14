import { useSlide } from "@steamfield/decks";
import { DUR } from "@steamfield/decks/kit";
import { motionMode } from "@steamfield/decks/motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { campusUtilization } from "../data/campus-utilization";
import type { CampusRecord } from "../data/campuses";
import styles from "./CampusHoverCard.module.css";

const signed = (value: number, digits = 0) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const utilizationPercent = (value: number | null) =>
  value === null ? "N/A" : `${value.toFixed(1)}%`;
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

type CampusHoverCardProps = {
  campus: CampusRecord | undefined;
  consecutiveFs: number;
  rates?: { x: number; y: number; change: number };
  closed?: boolean;
  recordMovedTo?: string;
  inheritedFrom?: string;
  ownConsecutiveFs?: number;
  id?: string;
  className?: string;
};

export function CampusHoverCard(props: CampusHoverCardProps) {
  const [content, setContent] = useState<{
    current: CampusHoverCardProps;
    old: CampusHoverCardProps | null;
  }>({ current: props, old: null });
  if (content.current.campus !== props.campus)
    setContent({ current: props, old: content.current.campus ? content.current : content.old });
  const removeOld = useCallback(() => setContent((value) => ({ ...value, old: null })), []);
  return (
    <>
      {content.old?.campus && (
        <CampusDetails
          key={content.old.campus.campusNumber}
          {...content.old}
          id={undefined}
          leaving
          onLeave={removeOld}
        />
      )}
      {content.current.campus && (
        <CampusDetails key={content.current.campus.campusNumber} {...content.current} />
      )}
    </>
  );
}

function CampusDetails(props: CampusHoverCardProps & { leaving?: boolean; onLeave?: () => void }) {
  const root = useRef<HTMLElement>(null);
  const { isActive, renderContext } = useSlide();
  const { leaving, onLeave } = props;
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!isActive || renderContext !== "slide" || motionMode() === "instant") {
      if (leaving) onLeave?.();
      return;
    }
    const hidden = { opacity: 0, transform: "translateY(calc(0.55 * var(--sh))) scale(0.985)" };
    const visible = { opacity: 1, transform: "none" };
    const animation = el.animate(leaving ? [visible, hidden] : [hidden, visible], {
      duration: (DUR.card / 2) * 1000,
      // The Slidev hover transition uses this curve rather than the story card's ease.
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    });
    animation.onfinish = () => {
      if (leaving) onLeave?.();
    };
    return () => {
      animation.cancel();
    };
  }, [leaving, onLeave, isActive, renderContext]);
  const { campus, consecutiveFs, rates, closed, recordMovedTo, inheritedFrom, ownConsecutiveFs } =
    props;
  if (!campus) return null;
  const schoolYear = `${campus.year - 1}–${String(campus.year).slice(-2)}`;
  const rateRows = rates
    ? [
        { year: 2025, value: rates.x },
        { year: 2026, value: rates.y },
      ]
    : [];
  const trend = !rates?.change ? "flat" : rates.change > 0 ? "up" : "down";
  const countTone = consecutiveFs >= 5 ? "crossed" : consecutiveFs === 4 ? "near" : "neutral";
  const utilization = campusUtilization(campus.campusNumber);
  return (
    <aside
      ref={root}
      id={props.id}
      className={`${styles.tooltip} ${props.className ?? ""}`}
      role="tooltip"
      aria-hidden={leaving || undefined}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.name}>{campus.campus}</div>
          <div className={styles.year}>
            {schoolYear} <span>·</span> TEA {campus.campusNumber}
          </div>
        </div>
        <div
          className={styles.grade}
          data-grade={campus.rating}
          role="img"
          aria-label={`Latest letter grade ${campus.rating}, score ${campus.score} out of 100`}
        >
          <span className={styles.gradeLabel}>Latest grade</span>
          <div>
            <strong>{campus.rating}</strong>
            <span className={styles.gradeScore}>
              {campus.score}
              <span>/100</span>
            </span>
          </div>
        </div>
      </header>
      {rates && (
        <section className={styles.rates} aria-label="STAAR pass rates">
          <div className={styles.heading}>
            <span>STAAR pass rate</span>
            <strong className={styles.change} data-trend={trend}>
              <span aria-hidden="true">{trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}</span>{" "}
              {rates.change > 0 ? "+" : ""}
              {rates.change.toFixed(1)} pp
            </strong>
          </div>
          {rateRows.map((rate) => (
            <div
              key={rate.year}
              className={styles.rateRow}
              data-year={rate.year}
              data-trend={trend}
            >
              <span className={styles.rateLabel}>Spring {rate.year}</span>
              <span className={styles.rateTrack} aria-hidden="true">
                <span style={{ width: `${rate.value}%` }} />
              </span>
              <strong>
                {rate.value.toFixed(1)}
                <span className={styles.unit}>%</span>
              </strong>
            </div>
          ))}
        </section>
      )}
      <section className={styles.utilization} aria-label="Estimated campus utilization">
        <div className={styles.heading}>
          <span>Estimated utilization</span>
          <strong>
            {utilization.change === null ? "N/A" : `${signed(utilization.change, 1)} pp`}
          </strong>
        </div>
        <div className={styles.utilizationYears}>
          <span>
            2017–18 <strong>{utilizationPercent(utilization.utilizationStart)}</strong>
          </span>
          <span aria-hidden="true">→</span>
          <span>
            2025–26 <strong>{utilizationPercent(utilization.utilizationEnd)}</strong>
          </span>
        </div>
        <div className={styles.utilizationEnrollment}>
          Enrollment: {utilization.start?.toLocaleString("en-US") ?? "N/A"} →{" "}
          {utilization.end?.toLocaleString("en-US") ?? "N/A"}
          {utilization.enrollmentChange !== null && (
            <> ({signed(utilization.enrollmentChange)} students)</>
          )}
        </div>
        <div className={styles.assumption}>
          {utilization.capacity
            ? `Assumes ${utilization.capacity.toLocaleString("en-US")} permanent seats in both years.`
            : utilization.note}
          {utilization.capacity && utilization.note ? ` ${utilization.note}` : ""}
        </div>
      </section>
      <dl className={styles.metrics}>
        <div className={styles.metricRow}>
          <dt>Economically disadvantaged</dt>
          <dd>{percent(campus.ecoDis)}</dd>
          <div className={styles.populationTrack} aria-hidden="true">
            <span style={{ width: percent(campus.ecoDis) }} />
          </div>
        </div>
        <div className={styles.metricRow}>
          <dt>Enrollment · {schoolYear}</dt>
          <dd>
            {campus.enrollment.toLocaleString("en-US")}{" "}
            <span className={styles.valueUnit}>students</span>
          </dd>
        </div>
        <div className={`${styles.metricRow} ${styles.countRow}`} data-count={countTone}>
          <dt>Consecutive F count*</dt>
          <dd>
            <span className={styles.countSteps} aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={n <= consecutiveFs ? styles.filled : undefined} />
              ))}
            </span>
            <strong>{consecutiveFs}</strong>
            <span className={styles.valueUnit}>/ 5</span>
          </dd>
        </div>
      </dl>
      {inheritedFrom ? (
        <div className={`${styles.note} ${styles.inheritedNote}`}>
          Inherited from {inheritedFrom} (closed). Own-campus count: {ownConsecutiveFs}.
        </div>
      ) : closed ? (
        <div className={styles.note}>
          Closed for 2026–27.{recordMovedTo && <> Record moved to {recordMovedTo}.</>}
        </div>
      ) : campus.rating === "D" && consecutiveFs > 0 ? (
        <div className={styles.note}>The latest D pauses this count.</div>
      ) : null}
      <footer className={styles.method}>
        <div>*Derived count: D / Not Rated pauses; A–C resets. Five Fs triggers state action.</div>
        <div>Utilization: TEA enrollment ÷ AISD published capacity; pp = percentage points.</div>
        {rates && (
          <div>
            Pass rate: Approaches or above; English tests, excluding science. pp = percentage
            points.
          </div>
        )}
      </footer>
    </aside>
  );
}
