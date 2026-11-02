// A cassette drawn from one deck's resolved theme: the shell, the label paper and
// its stripe band are that deck's own colors, so two cassettes look different only
// where their decks do. Static markup; the player and the rack both use it.
import type { CSSProperties } from "react";
import type { TapeTheme } from "../../lib/player/tape";

export function Reel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="19" fill="var(--tape-ink)" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="var(--tape-paper)" strokeWidth="1.5" />
      <g className="reel">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <rect
            key={angle}
            x="19"
            y="8"
            width="2"
            height="6"
            rx="1"
            fill="var(--tape-paper)"
            transform={`rotate(${angle} 20 20)`}
          />
        ))}
        <circle cx="20" cy="20" r="4" fill="var(--tape-paper)" />
      </g>
    </svg>
  );
}

export const tapeStyle = (theme: TapeTheme) =>
  ({
    "--tape-shell": theme.shell,
    "--tape-ink": theme.ink,
    "--tape-paper": theme.paper,
    "--tape-s1": theme.stripes[0],
    "--tape-s2": theme.stripes[1],
    "--tape-s3": theme.stripes[2],
  }) as CSSProperties;

/** The label: title in marker hand on the deck's paper color, stripes, side and brand. */
export function CassetteLabel({
  title,
  theme,
  slides,
  compact = false,
}: {
  title: string;
  theme: TapeTheme;
  slides: number;
  compact?: boolean;
}) {
  return (
    <span
      className="flex min-w-0 flex-col gap-1 rounded-xs px-2 py-1.5"
      style={{ background: "var(--tape-paper)", color: "var(--tape-ink)" }}
    >
      <span className="flex items-baseline justify-between gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
        <span>Side A</span>
        <span>{slides > 0 ? `${slides} slides` : theme.brand}</span>
      </span>
      <span
        className={`font-hand leading-tight ${compact ? "line-clamp-1 text-base" : "line-clamp-2 text-lg"}`}
      >
        {title}
      </span>
      <span aria-hidden="true" className="flex h-1.5 overflow-hidden rounded-xs">
        <span className="flex-1" style={{ background: "var(--tape-s1)" }} />
        <span className="flex-1" style={{ background: "var(--tape-s2)" }} />
        <span className="flex-1" style={{ background: "var(--tape-s3)" }} />
      </span>
    </span>
  );
}

/** The whole cassette, front view: shell, label, and the two-reel window. */
export function Cassette({
  title,
  theme,
  slides,
}: {
  title: string;
  theme: TapeTheme;
  slides: number;
}) {
  return (
    <span
      style={tapeStyle(theme)}
      className="flex flex-col gap-2 rounded-md border border-white/10 p-2"
    >
      <span
        style={{ background: "var(--tape-shell)" }}
        className="flex flex-col gap-2 rounded-sm p-2"
      >
        <CassetteLabel title={title} theme={theme} slides={slides} />
        <span
          aria-hidden="true"
          className="mx-auto flex w-3/4 items-center justify-between rounded-xs px-2 py-1"
          style={{ background: "var(--tape-ink)" }}
        >
          <Reel className="size-6" />
          <span className="h-px flex-1 bg-white/20" />
          <Reel className="size-6" />
        </span>
      </span>
    </span>
  );
}
