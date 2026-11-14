import { useDeck, useSlide } from "@steamfield/decks";
import {
  CANVAS,
  clamp01,
  DUR,
  gsap,
  hashRange,
  hashSigned,
  InkPing,
  ink,
  rippleProgress,
  SETTLE,
  StoryCard,
  StoryLink,
  StoryStage,
  UnitGrid,
  type UnitGridItem,
  unitCellCenter,
  useStage,
} from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { useId, useState } from "react";
import {
  waffleBaseGroup,
  waffleCampuses,
  waffleCounts,
  waffleDisplayCampuses,
  waffleOpenDf,
  waffleOpenDfThreeYears,
} from "../data/07-waffle";
import { accountabilitySourceUrl } from "../data/campuses";
import { CampusHoverCard } from "./CampusHoverCard";
import styles from "./WaffleStage.module.css";

const FINAL_ITEMS: UnitGridItem[] = waffleCampuses.map((campus) => ({
  id: campus.campusNumber,
  category: campus.tier,
}));
const GEOM = {
  origin: { x: 960, y: 215 },
  cols: 12,
  cellWidth: 54,
  cellHeight: 54,
  gapX: 14,
  gapY: 14,
};
const CELL = GEOM.cellWidth;
const corner = (i: number) => {
  const c = unitCellCenter(i, GEOM);
  return { x: c.x - CELL / 2, y: c.y - CELL / 2 };
};
const CHRONIC_IDX = FINAL_ITEMS.flatMap((it, i) => (it.category === "chronic" ? [i] : []));
const FOUR_IDX = FINAL_ITEMS.flatMap((it, i) => (it.category === "atFour" ? [i] : []));
const RECEIVERS = waffleCampuses.filter((campus) => campus.inheritedFrom).length;
const OWN_RECORD = waffleCounts.atFour - RECEIVERS;
const FROM = (() => {
  const cs = CHRONIC_IDX.map((i) => unitCellCenter(i, GEOM));
  return {
    x: cs.reduce((a, c) => a + c.x, 0) / cs.length,
    y: cs.reduce((a, c) => a + c.y, 0) / cs.length,
  };
})();
const dist = (i: number) => {
  const c = unitCellCenter(i, GEOM);
  return Math.hypot(c.x - FROM.x, c.y - FROM.y);
};
const REACH = Math.max(...FOUR_IDX.map(dist));
const RIPPLE = 0.5;
const NINE_DUR = DUR.morph * 2;
const PING_DUR = DUR.grow * 2;
const NINE_SEED = "aisd-waffle-nine";
const NINE_START = new Map(
  FOUR_IDX.map((i) => {
    const lead = clamp01(dist(i) / REACH + hashSigned(NINE_SEED, i, 0.08));
    return [i, lead * RIPPLE * NINE_DUR + hashRange(`${NINE_SEED}-ping`, i, 0, DUR.card)];
  }),
);
const NINE_SPAN = Math.max(...NINE_START.values()) + PING_DUR;
const PAIR_START = CHRONIC_IDX.map((_, k) => k * DUR.card * 0.6);
const PAIR_SPAN = Math.max(...PAIR_START) + PING_DUR;
const beaconAt = (field: number, span: number, start: number) =>
  clamp01((field * span - start) / PING_DUR);
const settle = gsap.parseEase(SETTLE);
const DIM = 0.62;
const COPY = [
  {
    lead: `${waffleCampuses.length} open campuses, rated by TEA.`,
    body: "Every square is an AISD campus open this year, by its 2025-26 rating.",
  },
  {
    lead: `${waffleOpenDf} are rated D or F.`,
    body: `${waffleOpenDfThreeYears} of them for three straight years.`,
  },
  {
    lead: "Burnet and Webb crossed.",
    body: "District-wide, 36 gained a grade; D/F fell from 41 to 31.",
  },
  {
    lead: "Nine more are one F away.",
    body: "Six carry a closed school's record. Last year only three were at four.",
  },
];

export function WaffleStage() {
  const { renderContext } = useSlide();
  const s = useTween({ reveal: 0, recolor: 0, crossed: 0, pingPair: 0, nine: 0, pingNine: 0 });
  const { clicks, isActive, playCount, copy, beats } = useStage({
    copy: COPY,
    enter: (tl) => {
      tl.to(s, { reveal: 1, duration: DUR.scale, ease: SETTLE });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(s, { recolor: 1, duration: DUR.color, ease: SETTLE });
      beat(1);
      tl.to(s, { crossed: 1, duration: DUR.color, ease: SETTLE });
      tl.to(s, { pingPair: 1, duration: PAIR_SPAN, ease: "none" }, "<");
      beat(2);
      tl.to(s, { nine: 1, duration: NINE_DUR, ease: "none" });
      tl.to(s, { pingNine: 1, duration: NINE_SPAN, ease: "none" }, "<");
      beat(3);
    },
  });
  const displayCampuses = waffleDisplayCampuses(s.nine > 0);
  const items = displayCampuses.map((campus) => ({
    id: campus.campusNumber,
    category: campus.tier,
  }));
  const dimAmber = `color-mix(in oklab, ${ink("amber", 2)} ${((1 - DIM) * 100).toFixed(0)}%, ${CANVAS})`;
  const dimViolet = `color-mix(in oklab, ${ink("violet", 2)} ${((1 - DIM) * 100).toFixed(0)}%, ${CANVAS})`;
  const crossed = (s.crossed * 100).toFixed(1);
  const fallen = `color-mix(in oklab, ${dimAmber} ${crossed}%, ${ink("amber", 2)})`;
  const colorBy =
    s.recolor < 0.5
      ? undefined
      : (item: UnitGridItem, index: number) => {
          if (item.category === "chronic") return ink("rose", 3);
          if (item.category === "dfOther") return fallen;
          if (item.category === "atFour") {
            const campus = displayCampuses[index];
            if (!campus) throw new Error(`Waffle cell ${index} has no campus`);
            const inherited = waffleBaseGroup(campus) === "inherited";
            const base = inherited
              ? `color-mix(in oklab, ${dimViolet} ${crossed}%, ${ink("violet", 2)})`
              : fallen;
            const local = rippleProgress(s.nine, unitCellCenter(index, GEOM), FROM, RIPPLE, {
              reach: REACH,
              seed: NINE_SEED,
              index,
            });
            if (local <= 0) return base;
            return `color-mix(in oklab, ${ink(inherited ? "violet" : "amber", 3)} ${(settle(local) * 100).toFixed(1)}%, ${base})`;
          }
          return ink("slate", 1);
        };
  const nineLit = s.nine > 0;
  const [hoverCampus, setHoverCampus] = useState<string | null>(null);
  const [focusCampus, setFocusCampus] = useState<string | null>(null);
  const [visit, setVisit] = useState({ clicks, isActive });
  if (visit.clicks !== clicks || visit.isActive !== isActive) {
    setVisit({ clicks, isActive });
    setHoverCampus(null);
    setFocusCampus(null);
  }
  const activeCampus = hoverCampus ?? focusCampus;
  const selected = waffleCampuses.find((c) => c.campusNumber === activeCampus);
  const tooltipId = useId();
  const { next, prev } = useDeck();
  const dismiss = () => {
    setHoverCampus(null);
    setFocusCampus(null);
  };
  return (
    <StoryStage
      beats={beats}
      click={clicks}
      stage={
        <>
          <g key={playCount}>
            <UnitGrid
              {...GEOM}
              items={items}
              glyph="square"
              color={ink("slate", 1)}
              colorBy={colorBy}
              seed="aisd-waffle"
              reveal={s.reveal}
              recolor={s.recolor}
            />
          </g>
          {CHRONIC_IDX.map((i, k) => (
            <InkPing
              key={`pair-${i}`}
              {...corner(i)}
              width={CELL}
              height={CELL}
              rx={10}
              hue="rose"
              beacon
              progress={beaconAt(s.pingPair, PAIR_SPAN, PAIR_START[k] ?? 0)}
            />
          ))}
          {FOUR_IDX.map((i) => (
            <InkPing
              key={`nine-${i}`}
              {...corner(i)}
              width={CELL}
              height={CELL}
              rx={10}
              hue={waffleCampuses[i]?.inheritedFrom ? "violet" : "amber"}
              beacon
              progress={beaconAt(s.pingNine, NINE_SPAN, NINE_START.get(i) ?? 0)}
            />
          ))}
        </>
      }
      overlay={
        <>
          <h2 className="od-story-head">
            It is not just two schools. {/* lint-allow: not-just-reveal */}
          </h2>
          <div
            className={styles.key}
            style={{ opacity: s.recolor, display: selected ? "none" : undefined }}
          >
            <div className={styles.row} style={{ order: 1 }}>
              <span className={`${styles.swatch} ${styles.rose}`} />
              <span>{waffleCounts.chronic} crossed the fifth F</span>
            </div>
            {nineLit && (
              <div className={styles.row} style={{ order: 2, opacity: clamp01(s.nine / RIPPLE) }}>
                <span className={`${styles.swatch} ${styles.amber}`} />
                <span>{OWN_RECORD} at four Fs on their own record</span>
              </div>
            )}
            <div
              className={styles.row}
              style={{ opacity: 1 - DIM * s.crossed, order: nineLit ? 4 : 3 }}
            >
              <span className={`${styles.swatch} ${styles.amber}`} />
              <span>{waffleCounts.dfOther + (nineLit ? 0 : OWN_RECORD)} other D or F</span>
            </div>
            <div
              className={styles.row}
              style={{ opacity: 1 - DIM * s.crossed * (1 - s.nine), order: nineLit ? 3 : 4 }}
            >
              <span className={`${styles.swatch} ${styles.violet}`} />
              <span>{RECEIVERS} inherited four Fs</span>
            </div>
            <div className={styles.row} style={{ order: 5 }}>
              <span className={`${styles.swatch} ${styles.slate}`} />
              <span>{waffleCounts.other} other C or better</span>
            </div>
          </div>
          {renderContext === "slide" && (
            <div className={styles.targets}>
              {displayCampuses.map((campus, i) => (
                <button
                  key={campus.campusNumber}
                  type="button"
                  className={`${styles.target}${activeCampus === campus.campusNumber ? ` ${styles.selected}` : ""}`}
                  style={{
                    left: `${corner(i).x / 19.2}%`,
                    top: `${corner(i).y / 10.8}%`,
                    width: `${CELL / 19.2}%`,
                    height: `${CELL / 10.8}%`,
                  }}
                  data-campus={campus.campusNumber}
                  aria-label={`${campus.campus}: grade ${campus.rating}, ${campus.consecutiveFs} consecutive F ratings${campus.inheritedFrom ? ", inherited count" : ""}`}
                  aria-describedby={activeCampus === campus.campusNumber ? tooltipId : undefined}
                  onPointerEnter={() => setHoverCampus(campus.campusNumber)}
                  onPointerLeave={() => setHoverCampus(null)}
                  onFocus={() => setFocusCampus(campus.campusNumber)}
                  onBlur={() => setFocusCampus(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFocusCampus(campus.campusNumber);
                  }}
                  onKeyDown={(event) => {
                    if (["Escape", "Enter", " ", "ArrowRight", "ArrowLeft"].includes(event.key))
                      event.stopPropagation();
                    if (event.key === "Escape") {
                      event.preventDefault();
                      dismiss();
                    }
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      next();
                    }
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      prev();
                    }
                  }}
                />
              ))}
              <CampusHoverCard
                id={tooltipId}
                className={styles.tooltip}
                campus={selected}
                consecutiveFs={selected?.consecutiveFs ?? 0}
                inheritedFrom={selected?.inheritedFrom?.campus}
                ownConsecutiveFs={selected?.ownConsecutiveFs}
              />
            </div>
          )}
          <div className={styles.hint}>Hover or focus a square for campus details.</div>
          <StoryLink
            href={accountabilitySourceUrl}
            label="Source: TEA 2026 accountability data · F counts derived"
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
