// Static landing sections. They render to HTML at build time and ship no
// JavaScript; only components listed in site.islands may take a client: directive.
import type { ReactNode } from "react";
import type { Comparison, Link, Track } from "../../config";
import type { HookDenial, SmokeRun } from "../../data/fixtures";
import { runFigures } from "../../data/fixtures";
import type { Tape } from "../../lib/player/tape";

export function ReleaseBanner({ announcement }: { announcement: Link | null }) {
  if (!announcement) return null;
  return (
    <p className="bg-panel border-line border-b px-6 py-2 text-center text-sm">
      <a className="text-ink font-medium" href={announcement.href}>
        {announcement.label}
      </a>
    </p>
  );
}

export function Hero({ tagline, description }: { tagline: string; description: string }) {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{tagline}</h1>
      <p className="text-ink-2 text-lg leading-relaxed">{description}</p>
    </div>
  );
}

/** A landing section: heading column on the left, content on the right from lg up. */
export function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-line border-t">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12 lg:py-20">
        <div className="flex flex-col gap-3">
          <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h2>
          {lede && <p className="text-ink-2 leading-relaxed">{lede}</p>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function FitLists({ yes, no }: { yes: string[]; no: string[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[
        { title: "Fits if", items: yes, mark: "+" },
        { title: "Doesn't fit if", items: no, mark: "−" },
      ].map((list) => (
        <div key={list.title} className="border-line rounded-md border p-4">
          <h3 className="text-ink mb-3 font-semibold">{list.title}</h3>
          <ul className="flex flex-col gap-2">
            {list.items.map((item) => (
              <li key={item} className="text-ink-2 flex gap-3 leading-snug">
                <span aria-hidden="true" className="text-muted w-3 shrink-0 font-mono">
                  {list.mark}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Three rows, each a topic and the two approaches side by side; stacks on narrow screens. */
export function CompareTable({ rows }: { rows: Comparison[] }) {
  return (
    <div className="border-line divide-line flex flex-col divide-y rounded-md border">
      <div
        aria-hidden="true"
        className="bg-panel hidden gap-6 px-4 py-3 text-sm md:grid md:grid-cols-[8rem_1fr_1fr]"
      >
        <span />
        <span className="text-ink font-semibold">v-click and a chart library</span>
        <span className="text-ink font-semibold">A Decks story slide</span>
      </div>
      {rows.map((row) => (
        <div key={row.topic} className="grid gap-2 px-4 py-4 md:grid-cols-[8rem_1fr_1fr] md:gap-6">
          <h3 className="text-ink font-medium">{row.topic}</h3>
          <p className="text-ink-2 leading-relaxed">
            <span className="text-muted block text-xs md:sr-only">v-click and a chart library</span>
            {row.vclick}
          </p>
          <p className="text-ink leading-relaxed">
            <span className="text-muted block text-xs md:sr-only">A Decks story slide</span>
            {row.decks}
          </p>
        </div>
      ))}
    </div>
  );
}

function Side({ side, title, tracks }: { side: string; title: string; tracks: Track[] }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="flex items-baseline gap-3">
        <span className="border-line-strong rounded-xs border px-1.5 text-xs font-semibold tracking-[0.12em] uppercase">
          Side {side}
        </span>
        <span className="text-ink font-semibold">{title}</span>
      </h3>
      <ol className="flex flex-col">
        {tracks.map((track, index) => (
          <li
            key={track.name}
            className="border-line flex items-baseline gap-3 border-b border-dashed py-2 last:border-b-0"
          >
            <span className="text-muted w-5 shrink-0 text-right font-mono text-xs tabular-nums">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
              <a href={track.href} className="text-ink">
                {track.name}
              </a>
              <span className="text-muted font-mono text-xs">{track.note}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The J-card: a spine with the title in marker hand, side A the package, side B the repo. */
export function JCard({ title, a, b }: { title: string; a: Track[]; b: Track[] }) {
  return (
    <div className="border-line-strong bg-panel grid overflow-hidden rounded-sm border md:grid-cols-[4.5rem_1fr_1fr]">
      <div className="border-line-strong flex items-center justify-center border-b p-3 md:border-r md:border-b-0">
        <p className="font-hand text-2xl leading-none md:[writing-mode:vertical-rl] md:rotate-180">
          {title}
        </p>
      </div>
      <Side side="A" title="The npm package" tracks={a} />
      <div className="border-line-strong border-t md:border-t-0 md:border-l">
        <Side side="B" title="The repository" tracks={b} />
      </div>
    </div>
  );
}

export function Transcript({ run }: { run: SmokeRun }) {
  const figures = runFigures(run);
  const shown = run.steps.reduce((sum, step) => sum + step.calls.length, 0);
  return (
    <figure className="border-line overflow-hidden rounded-md border">
      <figcaption className="border-line bg-panel flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-4 py-2 text-sm">
        <span className="text-ink font-medium">Excerpt from a real run, abbreviated</span>
        <span className="text-muted">
          {figures.turns} turns, {figures.minutes} minutes, {figures.cost}. {shown} of{" "}
          {run.toolCalls} tool calls shown.
        </span>
      </figcaption>
      <ol className="divide-line flex flex-col divide-y font-mono text-[13px]">
        <li className="px-4 py-3">
          <span aria-hidden="true" className="text-muted select-none">
            ❯{" "}
          </span>
          <span className="text-ink">claude -p "{run.prompt}"</span>
        </li>
        {run.steps.map((step) => (
          <li
            key={step.calls.join()}
            className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[minmax(0,1fr)_16rem]"
          >
            <div className="min-w-0">
              {step.calls.map((call) => (
                <p key={call} className="text-ink break-words">
                  <span aria-hidden="true" className="text-muted select-none">
                    ●{" "}
                  </span>
                  {call}
                </p>
              ))}
              {step.output && (
                <p className="text-ink-2 break-words">
                  <span aria-hidden="true" className="text-muted select-none">
                    {"  "}⎿{" "}
                  </span>
                  {step.output}
                </p>
              )}
            </div>
            {step.note && <p className="text-muted font-sans text-sm">{step.note}</p>}
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function HookPanel({ denial }: { denial: HookDenial }) {
  return (
    <figure className="border-line overflow-hidden rounded-md border">
      <figcaption className="border-line bg-panel border-b px-4 py-3">
        <p className="text-ink font-medium">
          We fed the lint hook this line; it refused the write.
        </p>
        <p className="text-muted mt-1 text-sm">
          <code>{denial.hook}</code> is a hook that blocks writes matching a list of known AI-prose
          patterns. Here it ran on a {denial.tool} to <code>{denial.file}</code>.
        </p>
      </figcaption>
      <div className="flex flex-col gap-3 p-4">
        <pre className="bg-panel border-line rounded-sm border p-3 text-[13px] break-words whitespace-pre-wrap">
          <code>{denial.line}</code>
        </pre>
        <p className="text-ink text-sm">
          Decision: <strong>{denial.decision}</strong>. Rules:{" "}
          {denial.rules.map((rule, index) => (
            <span key={rule}>
              {index > 0 && ", "}
              <code>{rule}</code>
            </span>
          ))}
          .
        </p>
        <pre className="text-ink-2 text-[12px] leading-5 break-words whitespace-pre-wrap">
          <code>{denial.reason.join("\n")}</code>
        </pre>
      </div>
    </figure>
  );
}

export function Requirements({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-ink font-semibold">What you need</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-ink-2 leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Without JavaScript: the start deck's text, beat by beat, as `make demo` recorded it. */
export function DeckProse({ tape }: { tape: Tape }) {
  const withText = tape.states.filter((state) => state.lead || state.body);
  if (withText.length === 0) return null;
  return (
    <div className="no-js-only flex max-w-3xl flex-col gap-3">
      <h2 className="text-ink text-base font-semibold">{tape.title}: the deck's text</h2>
      <ol className="flex flex-col gap-3">
        {withText.map((state) => (
          <li key={`${state.slide}-${state.beat}`} className="flex flex-col gap-0.5">
            <span className="text-muted text-xs">
              Slide {state.slide}, step {state.beat + 1}
            </span>
            <span className="text-ink font-medium">{state.lead}</span>
            {state.body && <span className="text-ink-2">{state.body}</span>}
          </li>
        ))}
      </ol>
      <p>
        <a href={tape.href}>Open the example deck</a>
      </p>
    </div>
  );
}
