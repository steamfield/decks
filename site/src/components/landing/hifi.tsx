// The hardware the player is drawn with: a cassette, its hubs and tape packs, the
// VU meters, the counter, the VFD, piano keys, LEDs and screws. Markup and SVG
// only; DeckPlayer owns the state and passes readouts in. Every moving part here
// shows a real value: tape packs track position in the deck, needles track the
// step and deck meters, the counter is the step number.
import type { CSSProperties, ReactNode } from "react";
import { packRadii, type Shell, type TapeTheme } from "../../lib/player/tape";

export function Screw({ className = "", turn = 20 }: { className?: string; turn?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`screw ${className}`}
      style={{ "--turn": `${turn}deg` } as CSSProperties}
    />
  );
}

export function Led({ on, color = "red" }: { on: boolean; color?: "red" | "green" | "amber" }) {
  return <span aria-hidden="true" className="led" data-color={color} data-on={on || undefined} />;
}

/** Wraps a title onto at most `lines` lines of about `width` characters, with an ellipsis. */
export function wrapTitle(title: string, width = 20, lines = 2): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of title.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= width) line = `${line} ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  if (out.length <= lines) return out;
  const kept = out.slice(0, lines);
  kept[lines - 1] = `${kept[lines - 1]}…`;
  return kept;
}

const SHELL_FILL: Record<Shell["kind"], (shell: Shell) => string> = {
  clear: () => "rgb(214 224 232 / 0.22)",
  smoke: () => "rgb(28 28 32 / 0.9)",
  tint: (shell) =>
    shell.kind === "tint" ? `color-mix(in srgb, ${shell.color} 62%, transparent)` : "",
};

function Hub({ cx, spin }: { cx: number; spin: "forward" | "backward" | "still" }) {
  return (
    <g transform={`translate(${cx} 114)`}>
      <g className="hub" data-spin={spin}>
        <circle r="13" fill="#ecebe6" />
        <circle r="8.5" fill="#1a1a1c" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <rect
            key={angle}
            x="-1.6"
            y="-8.6"
            width="3.2"
            height="4"
            fill="#ecebe6"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
    </g>
  );
}

/**
 * A compact cassette, front view, drawn from the deck's theme: the shell plastic,
 * the label paper and its stripes. `progress` (0..1) sets how much tape has
 * wound from the left hub to the right one.
 */
export function CassetteArt({
  theme,
  title,
  steps,
  progress,
  spin = "still",
  className = "",
}: {
  theme: TapeTheme;
  title: string;
  steps: number;
  progress: number;
  spin?: "forward" | "backward" | "still";
  className?: string;
}) {
  const packs = packRadii(progress);
  const maxPack = 44;
  const lines = wrapTitle(title, 22);
  const fill = SHELL_FILL[theme.shell.kind](theme.shell);
  const clip = `window-${title.length}-${theme.shell.kind}`;
  return (
    <svg viewBox="0 0 400 250" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={clip}>
          <rect x="118" y="88" width="164" height="54" rx="6" />
        </clipPath>
        <linearGradient id={`${clip}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* The mechanism behind a see-through shell: guide rollers and the tape path. */}
      <rect x="6" y="6" width="388" height="238" rx="12" fill="#121214" />
      <path d="M60 222 L120 196 H280 L340 222" fill="none" stroke="#5a3b26" strokeWidth="3" />
      <circle cx="70" cy="216" r="7" fill="#d9d6cf" />
      <circle cx="330" cy="216" r="7" fill="#d9d6cf" />
      <g clipPath={`url(#${clip})`}>
        <rect x="118" y="88" width="164" height="54" fill="#0d0d0f" />
        <circle cx="158" cy="114" r={packs.supply * maxPack} fill="#4b2e1c" />
        <circle cx="242" cy="114" r={packs.takeup * maxPack} fill="#4b2e1c" />
        <circle cx="158" cy="114" r={packs.supply * maxPack} fill="url(#pack-sheen)" />
        <circle cx="242" cy="114" r={packs.takeup * maxPack} fill="url(#pack-sheen)" />
        <Hub cx={158} spin={spin} />
        <Hub cx={242} spin={spin} />
      </g>
      {/* Shell plastic, then its gloss and seams. */}
      <path
        d="M14 2 H386 Q398 2 398 14 V236 Q398 248 386 248 H14 Q2 248 2 236 V14 Q2 2 14 2 Z M118 94 Q118 88 124 88 H276 Q282 88 282 94 V136 Q282 142 276 142 H124 Q118 142 118 136 Z"
        fillRule="evenodd"
        fill={fill}
        stroke="rgb(255 255 255 / 0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M92 248 L108 190 H292 L308 248"
        fill="rgb(0 0 0 / 0.22)"
        stroke="rgb(255 255 255 / 0.18)"
      />
      {[110, 150, 250, 290].map((x) => (
        <circle key={x} cx={x + (x < 200 ? 6 : -6)} cy="232" r="4" fill="#09090a" />
      ))}
      {/* The label: deck paper, deck ink, the deck's three ramp colors as a stripe band. */}
      <path
        d="M30 20 H370 Q376 20 376 26 V160 Q376 166 370 166 H30 Q24 166 24 160 V26 Q24 20 30 20 Z M118 94 Q118 88 124 88 H276 Q282 88 282 94 V136 Q282 142 276 142 H124 Q118 142 118 136 Z"
        fillRule="evenodd"
        fill={theme.paper}
      />
      <rect x="24" y="148" width="352" height="6" fill={theme.stripes[0]} />
      <rect x="24" y="154" width="352" height="6" fill={theme.stripes[1]} />
      <rect x="24" y="160" width="352" height="6" fill={theme.stripes[2]} />
      <text x="36" y="142" className="legend-svg" fontSize="14" fill={theme.ink}>
        A
      </text>
      <text x="364" y="141" className="legend-svg" fontSize="9" fill={theme.ink} textAnchor="end">
        {steps > 0 ? `${steps} STEPS` : theme.brand.toUpperCase()}
      </text>
      <line x1="60" y1="50" x2="340" y2="50" stroke={theme.ink} strokeOpacity="0.25" />
      <line x1="60" y1="78" x2="340" y2="78" stroke={theme.ink} strokeOpacity="0.25" />
      {lines.map((line, index) => (
        <text
          key={line}
          x="200"
          y={index === 0 && lines.length > 1 ? 47 : 75}
          textAnchor="middle"
          className="hand-svg"
          fontSize="24"
          fill={theme.ink}
        >
          {line}
        </text>
      ))}
      {[
        [16, 16],
        [384, 16],
        [16, 234],
        [384, 234],
        [200, 236],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle r="5" fill="#b9b9bd" stroke="#4a4a4f" />
          <line x1="-3" y1="-1" x2="3" y2="1" stroke="#4a4a4f" strokeWidth="1.4" />
        </g>
      ))}
      <path
        d="M14 2 H386 Q398 2 398 14 V120 H2 V14 Q2 2 14 2 Z"
        fill={`url(#${clip}-gloss)`}
        pointerEvents="none"
      />
    </svg>
  );
}

/** Shared gradients the cassettes reference by id; rendered once per page. */
export function CassetteDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <radialGradient id="pack-sheen" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#c08a5a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="vu-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.31" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** An analog VU meter: a backlit cream face, dB scale and a needle with ballistics. */
export function VuMeter({
  label,
  level,
  kick,
  peak,
}: {
  label: string;
  level: number;
  /** A transition is running: the needle overshoots, then settles on `level`. */
  kick: boolean;
  peak: boolean;
}) {
  const angle = -48 + Math.min(1, Math.max(0, level)) * 96 + (kick ? 7 : 0);
  const marks = ["20", "10", "7", "5", "3", "0", "3"];
  return (
    <div className="vu">
      <svg viewBox="0 0 160 96" aria-hidden="true" className="block w-full">
        <defs>
          <radialGradient id={`vu-light-${label}`} cx="0.5" cy="0.95" r="0.9">
            <stop offset="0" stopColor="#fff6d6" />
            <stop offset="0.6" stopColor="#f3e2ad" />
            <stop offset="1" stopColor="#d9c27f" />
          </radialGradient>
        </defs>
        <rect width="160" height="96" rx="3" fill={`url(#vu-light-${label})`} />
        <path d="M22 54 A64 64 0 0 1 138 54" fill="none" stroke="#2a2418" strokeWidth="1.2" />
        <path d="M112 36 A64 64 0 0 1 138 54" fill="none" stroke="#b3261e" strokeWidth="4" />
        {marks.map((mark, index) => {
          const a = ((-48 + (index / (marks.length - 1)) * 96) * Math.PI) / 180;
          // Rounded so the server and the browser print the same attribute values.
          const at = (radius: number) => ({
            x: Math.round((80 + Math.sin(a) * radius) * 100) / 100,
            y: Math.round((92 - Math.cos(a) * radius) * 100) / 100,
          });
          const { x, y } = at(64);
          const inner = at(58);
          const { x: lx, y: ly } = at(76);
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed scale
            <g key={index}>
              <line
                x1={x}
                y1={y}
                x2={inner.x}
                y2={inner.y}
                stroke={index >= 5 ? "#b3261e" : "#2a2418"}
                strokeWidth="1.4"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fontSize="8"
                className="legend-svg"
                fill={index >= 5 ? "#b3261e" : "#2a2418"}
              >
                {index === 6 ? `+${mark}` : index === 5 ? mark : `-${mark}`}
              </text>
            </g>
          );
        })}
        <text x="80" y="74" textAnchor="middle" fontSize="11" className="legend-svg" fill="#2a2418">
          VU
        </text>
        <text x="10" y="90" fontSize="7" className="legend-svg" fill="#2a2418">
          {label.toUpperCase()}
        </text>
        <g className="needle" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="80" y1="92" x2="80" y2="24" stroke="#151310" strokeWidth="1.2" />
          <line x1="80" y1="34" x2="80" y2="24" stroke="#b3261e" strokeWidth="1.4" />
        </g>
        <circle cx="80" cy="92" r="6" fill="#151310" />
        <rect width="160" height="96" rx="3" fill="url(#vu-glass)" />
      </svg>
      <span className="vu-peak">
        <Led on={peak} color="red" />
        <span className="legend">Peak</span>
      </span>
    </div>
  );
}

/** A three-drum mechanical counter. The drums roll to the new digit. */
export function RollingCounter({ value }: { value: number }) {
  const digits = String(Math.max(0, Math.min(999, value)))
    .padStart(3, "0")
    .split("");
  return (
    <span className="counter" aria-hidden="true">
      {digits.map((digit, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: drum position is the identity
        <span key={index} className="drum">
          <span className="drum-strip" style={{ "--digit": Number(digit) } as CSSProperties}>
            {"0123456789".split("").map((d) => (
              <span key={d}>{d}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/** A vacuum fluorescent display. Lit segments glow; unlit ones show faintly behind. */
export function Vfd({
  main,
  spoken,
  children,
}: {
  main: string;
  /** What the display says, in words, for screen readers. */
  spoken: string;
  children?: ReactNode;
}) {
  return (
    <div className="vfd">
      <p className="sr-only">{spoken}</p>
      <p className="vfd-main" aria-hidden="true" data-ghost={main.replace(/[^ ./]/g, "~")}>
        <span>{main}</span>
      </p>
      <div className="vfd-row" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export function VfdFlag({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className="vfd-flag" data-on={on || undefined}>
      {children}
    </span>
  );
}

/** A piano-key transport button: it travels when pressed and stays down when latched. */
export function PianoKey({
  glyph,
  legend,
  name,
  onClick,
  latched,
  led,
}: {
  glyph: string;
  legend: string;
  name?: string;
  onClick: () => void;
  latched?: boolean;
  led?: { on: boolean; color: "red" | "green" | "amber" };
}) {
  return (
    <div className="key-slot">
      <span className="legend flex items-center justify-center gap-1.5">
        {led && <Led on={led.on} color={led.color} />}
        {legend}
      </span>
      <button
        type="button"
        className="key"
        aria-label={name}
        aria-pressed={latched}
        onClick={onClick}
      >
        <span aria-hidden="true">{glyph}</span>
        {!name && <span className="sr-only">{legend}</span>}
      </button>
    </div>
  );
}
