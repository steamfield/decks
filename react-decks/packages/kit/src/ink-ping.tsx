import { gsap } from "@react-decks/motion";
import { SETTLE } from "./easings";
import { FILTER_IDS, filterUrl } from "./filters";
import { inkStyle, STROKE } from "./ink-style";
import type { InkStep } from "./ramps";
import { ink } from "./theme";
import type { Hue } from "./theme-resolve";

const settle = gsap.parseEase(SETTLE);
const q = (n: number) => Math.round(n * 1000) / 1000;
const smooth = (t: number) => t * t * (3 - 2 * t);
const BEACON = { grow: 1.4, peak: 0.75, rise: 0.3, echoLag: 0.24, echoPeak: 0.55 };

/** A one-shot focus ring driven by its parent's progress. Both endpoints are invisible. */
export function InkPing({
  x,
  y,
  r = 10,
  width,
  height,
  rx = 0,
  hue = "cyan",
  step = 3,
  color = "",
  progress = 0,
  beacon = false,
}: {
  x: number;
  y: number;
  r?: number;
  width?: number;
  height?: number;
  rx?: number;
  hue?: Hue;
  step?: InkStep;
  color?: string;
  progress?: number;
  beacon?: boolean;
}) {
  if (progress <= 0 || progress >= 1) return null;
  const isRect = width !== undefined;
  const w = width ?? 0;
  const h = height ?? width ?? 0;
  const center = isRect ? { x: x + w / 2, y: y + h / 2 } : { x, y };
  const ringAt = (p: number, peak: number) => ({
    transform: `translate(${q(center.x)} ${q(center.y)}) scale(${q(1 + (beacon ? BEACON.grow : 0.8) * settle(p))})`,
    opacity: q(
      beacon
        ? peak * smooth(Math.min(1, p / BEACON.rise)) * (1 - p) ** 1.4
        : peak * Math.min(1, p / 0.15) * (1 - p),
    ),
  });
  const echoProgress = (progress - BEACON.echoLag) / (1 - BEACON.echoLag);
  const rings = [ringAt(progress, beacon ? BEACON.peak : 0.9)];
  if (beacon && echoProgress > 0 && echoProgress < 1)
    rings.push(ringAt(echoProgress, BEACON.echoPeak));
  const stroke = color || ink(hue, step);
  const strokeWidth = beacon ? STROKE.rule : STROKE.line;
  return rings.map((ring, i) => (
    <g
      key={i === 0 ? "focus" : "echo"}
      className="od-ink-ping"
      style={{ opacity: ring.opacity }}
      transform={ring.transform}
      aria-hidden="true"
      tabIndex={-1}
    >
      <g filter={inkStyle() === "clean" ? filterUrl(FILTER_IDS.glow) : undefined}>
        {isRect ? (
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={rx}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ) : (
          <circle r={r} stroke={stroke} strokeWidth={strokeWidth} />
        )}
      </g>
    </g>
  ));
}
