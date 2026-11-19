import { duration, ease, useTimeline } from "@steamfield/decks/motion";
import { useRef } from "react";
import { Block, Fish } from "./Fish";

const lead = { x: 784, y: 76, rotation: -8 };
const followers = [
  { x: 609, y: 348, rotation: -6 },
  { x: 160, y: 142, rotation: -13 },
  { x: 22, y: 390, rotation: -10 },
];

export function School() {
  const impressions = useRef<SVGGElement>(null);
  const carrier = useRef<SVGGElement>(null);
  const block = useRef<SVGGElement>(null);
  useTimeline((tl, beat) => {
    beat(0);
    if (!impressions.current || !carrier.current || !block.current) return;
    const marks = impressions.current.children;
    for (const [i, pose] of followers.entries()) {
      const mark = marks.item(i + 1);
      if (!mark) throw new Error(`Missing impression at ${pose.x}, ${pose.y}`);
      tl.to(carrier.current, { ...pose, duration: duration.slow, ease: ease.draw });
      tl.to(block.current, { y: 0, scaleY: 1, duration: duration.base, ease: ease.settle });
      tl.set(mark, { opacity: 1 });
      tl.to(block.current, {
        y: -12,
        scaleY: 0.18,
        opacity: i === followers.length - 1 ? 0 : 1,
        duration: duration.base,
        ease: ease.enter,
      });
      beat(i + 1);
    }
  });
  return (
    <svg
      viewBox="-66 -85 1530 785"
      role="img"
      aria-label="The block travels across the sheet, leaving a right-facing fish wherever it touches."
    >
      <g ref={impressions}>
        {[lead, ...followers].map(({ x, y, rotation }, i) => (
          <g
            key={x}
            transform={`translate(${x} ${y}) rotate(${rotation})`}
            opacity={i === 0 ? 1 : 0}
          >
            <g transform="translate(600 0) scale(-1 1)">
              <Fish />
            </g>
          </g>
        ))}
      </g>
      <g ref={carrier} transform={`translate(${lead.x} ${lead.y}) rotate(${lead.rotation})`}>
        <g ref={block} transform="translate(0 -12) scale(1 0.18)">
          <Block>
            <path fill="var(--od-lino)" d="M16 20 L585 15 L586 240 L18 247 Z" />
          </Block>
        </g>
      </g>
    </svg>
  );
}
