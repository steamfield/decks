import { useTemplateMotion } from "@steamfield/decks/kit";
import { duration, ease } from "@steamfield/decks/motion";
import { type ReactNode, useRef } from "react";

// The block, the proof and the texture on the press share the same cutting pattern.
export const silhouette =
  "M44 142 Q67 116 100 99 Q151 70 208 70 L258 34 Q269 31 275 39 L302 75 Q363 85 424 108 Q460 122 488 124 Q518 112 555 77 Q558 103 543 137 Q543 151 560 185 Q522 177 486 150 Q451 152 403 166 L365 197 L334 185 Q279 203 219 197 L190 224 L178 194 Q110 184 68 160 L89 156 Q65 157 44 148 Z";
export const engraving = [
  "M83 129 Q105 112 137 108 Q109 119 83 129Z",
  "M171 180 Q230 192 291 180 Q227 197 171 180Z",
  "M170 172 Q182 168 193 159 Q187 170 170 176Z",
  "M205 161 Q237 128 281 133 Q247 142 205 161Z",
  "M242 76 L259 45 L248 76Z M254 75 L269 48 L261 76Z M266 76 L275 59 L274 77Z",
  "M492 134 Q522 113 546 90 Q530 114 497 137Z M503 141 L545 173 L509 148Z",
  "M366 184 L387 167 L378 179Z M349 185 L365 173 L358 183Z",
  ...Array.from({ length: 19 }, (_, i) => {
    const x = 186 + i * 11;
    const y = 134 + Math.sin(i / 5) * 5;
    return `M${x} ${y} q4 -7 8 -8 q-1 5 -8 8Z`;
  }),
  ...Array.from({ length: 12 }, (_, i) => {
    const x = 184 + i * 20;
    const y = 84 + Math.abs(i - 3) ** 1.55;
    return `M${x} ${y} q12 -1 19 2 q-11 1 -19 -2Z`;
  }),
];
export const channels = [
  { name: "Gill", x: 149, y: 99, d: "M149 99 Q176 128 143 165" },
  { name: "Flank", x: 179, y: 119, d: "M179 119 Q270 86 365 118 T482 137" },
  { name: "Fin", x: 204, y: 167, d: "M204 167 Q243 157 273 139" },
];

export function Fish({
  body = "var(--od-blue)",
  cut = "var(--od-paper)",
  carved = true,
}: {
  body?: string;
  cut?: string;
  carved?: boolean;
}) {
  return (
    <g>
      <path d={silhouette} fill={body} />
      <g fill={cut}>
        {engraving.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx="105" cy="135" r="12" fill={cut} />
      <circle cx="103" cy="135" r="5" fill={body} />
      {carved &&
        channels.map(({ d }) => (
          <path key={d} d={d} fill="none" stroke={cut} strokeWidth="4" strokeLinecap="round" />
        ))}
    </g>
  );
}

export function Block({ children }: { children: ReactNode }) {
  return (
    <>
      <path fill="var(--od-edge)" d="M16 28 L585 22 L589 249 L19 256 Z" />
      <path fill="var(--od-recess)" d="M16 20 L585 15 L586 240 L18 247 Z" />
      {children}
    </>
  );
}

export function CoverFish() {
  const block = useRef<SVGGElement>(null);
  useTemplateMotion(0, (tl) => {
    if (!block.current) return;
    tl.fromTo(
      block.current,
      { x: 0, y: 0, rotation: 0, opacity: 1 },
      {
        x: -65,
        y: -65,
        rotation: -8,
        opacity: 0,
        duration: duration.slow,
        ease: ease.draw,
      },
    );
  });
  return (
    <svg
      viewBox="-62 -72 700 370"
      role="img"
      aria-label="The block lifts away to reveal a blue fish on paper."
    >
      <g transform="translate(600 0) scale(-1 1)">
        <Fish cut="var(--od-canvas)" />
      </g>
      <g ref={block}>
        <Block>
          <Fish cut="var(--od-recess)" />
        </Block>
      </g>
    </svg>
  );
}
