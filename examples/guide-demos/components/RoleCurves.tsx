import { duration, ease, rise, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";

const CURVES = [
  { token: "ease.snap", role: "A value arrives", ease: ease.snap },
  { token: "ease.punch", role: "An accent lands", ease: ease.punch },
  { token: "ease.leave", role: "Something leaves", ease: ease.leave },
  { token: "ease.slam", role: "A band crosses", ease: ease.slam },
];

const TRACK = 900;
const PLATE = 120;

const lane = {
  display: "grid",
  gridTemplateColumns: `340px ${TRACK}px`,
  alignItems: "center",
  gap: 48,
} as const;

/** One plate per role curve, each moved across the same track on its own click, then a word rising on the rise tokens. */
export function RoleCurves() {
  const plates = useRef<(HTMLDivElement | null)[]>([]);
  const word = useRef<HTMLSpanElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    for (const [index, curve] of CURVES.entries()) {
      tl.fromTo(
        plates.current[index] ?? null,
        { x: 0 },
        { x: TRACK - PLATE, duration: duration.slow, ease: curve.ease },
      );
      beat(index + 1);
    }
    tl.fromTo(
      word.current,
      { yPercent: rise.clear, skewY: rise.lean },
      { yPercent: 0, skewY: 0, duration: duration.slow, ease: ease.snap },
    );
    beat(CURVES.length + 1);
  }, []);

  return (
    <div style={{ display: "grid", gap: 36 }}>
      {CURVES.map((curve, index) => (
        <div key={curve.token} style={lane}>
          <div>
            <div className="od-mono" style={{ fontSize: 30, color: "var(--od-cyan)" }}>
              {curve.token}
            </div>
            <div className="od-caption">{curve.role}</div>
          </div>
          <div style={{ borderBottom: "2px solid var(--od-border)", paddingBottom: 8 }}>
            <div
              ref={(node) => {
                plates.current[index] = node;
              }}
              style={{
                width: PLATE,
                height: 56,
                borderRadius: 12,
                background: "var(--od-cyan)",
              }}
            />
          </div>
        </div>
      ))}
      <div style={lane}>
        <div>
          <div className="od-mono" style={{ fontSize: 30, color: "var(--od-amber)" }}>
            rise
          </div>
          <div className="od-caption">Type clears its mask</div>
        </div>
        <div style={{ overflow: "clip", fontSize: 56, fontWeight: 600, lineHeight: 1.2 }}>
          <span ref={word} style={{ display: "inline-block" }}>
            Arrives upright.
          </span>
        </div>
      </div>
    </div>
  );
}
