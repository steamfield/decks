// Static landing sections. They render to HTML at build time and ship no
// JavaScript; only components listed in site.islands may take a client: directive.
// Page callouts are plain panels: the slide's story card never doubles as chrome.
import type { CSSProperties, ReactNode } from "react";
import type { Comparison, Link, Requirement } from "../../config";
import { treeLines } from "../../lib/file-tree";
import type { Example, ProvenanceKind } from "../../lib/player/example";

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

/**
 * A landing section: a topic heading and an optional lede over the content.
 * `tone` alternates the page between canvas and band; a band lifts its panels.
 */
export function Section({
  id,
  title,
  lede,
  tone = "canvas",
  children,
}: {
  id: string;
  title: string;
  lede?: ReactNode;
  tone?: "canvas" | "band";
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="landing-section" data-tone={tone}>
      <div className="page-column flex flex-col">
        <div className="flex max-w-[44rem] flex-col gap-4" data-reveal>
          <h2 id={`${id}-title`} className="section-title">
            {title}
          </h2>
          {lede && <p className="section-lede">{lede}</p>}
        </div>
        <div className="section-body" data-reveal style={{ "--delay": "120ms" } as CSSProperties}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** What Decks needs and what it can't do, as label and text rows. */
export function Requirements({ items }: { items: Requirement[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="panel requirements" data-block>
      {items.map((item) => (
        <div key={item.label} className="requirement">
          <dt>{item.label}</dt>
          <dd>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The files `decks init` and `decks new` wrote, each with a few words on what it does. */
export function FileTree({
  files,
  notes,
  commands,
}: {
  files: string[];
  notes: Record<string, string>;
  commands: string[];
}) {
  if (files.length === 0) return null;
  return (
    <figure className="panel file-tree" data-block>
      <figcaption>
        After <code>bun add</code>, then{" "}
        {commands.map((c, i) => (
          <span key={c}>
            {i > 0 && " and "}
            <code>{c}</code>
          </span>
        ))}
      </figcaption>
      <ul>
        {treeLines(files).map((line) => (
          <li
            key={`${line.depth}-${line.label}-${line.path ?? ""}`}
            style={{ paddingInlineStart: `${line.depth * 1.25}rem` }}
            data-dir={line.path === null || undefined}
          >
            <span className="tree-name">{line.label}</span>
            {line.path && notes[line.path] && <span className="tree-note">{notes[line.path]}</span>}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Three rows, each a topic and the two approaches side by side; stacks on narrow screens. */
export function CompareTable({ rows }: { rows: Comparison[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="panel compare" data-block>
      <div aria-hidden="true" className="compare-head">
        <span />
        <span>v-click and a chart library</span>
        <span>Decks story slide</span>
      </div>
      {rows.map((row) => (
        <div key={row.topic} className="compare-row">
          <h3 className="text-ink font-medium">{row.topic}</h3>
          <p className="text-ink-2">
            <span className="compare-label">v-click and a chart library</span>
            {row.vclick}
          </p>
          <p className="text-ink">
            <span className="compare-label">Decks story slide</span>
            {row.decks}
          </p>
        </div>
      ))}
    </div>
  );
}

const KIND_LABEL: Record<ProvenanceKind, string> = {
  agent: "Agent",
  talk: "Talk",
  template: "Template",
  hand: "By hand",
};

/**
 * The example decks as rows: a 16:9 thumbnail, the title, and how each was made,
 * tagged in that provenance's hue. Each row links to the deck's static build;
 * src/scripts/site.ts turns a click into loading that deck in the hero player
 * and scrolling there.
 */
export function ExampleGallery({ examples }: { examples: Example[] }) {
  if (examples.length === 0) return null;
  return (
    <ul className="example-list">
      {examples.map((example) => (
        <li key={example.name}>
          <a
            href={example.href}
            data-example={example.name}
            data-kind={example.provenance.kind}
            className="example-row"
          >
            {example.poster ? (
              <img
                src={`${example.poster.base}-640.webp`}
                width={640}
                height={360}
                loading="lazy"
                alt=""
              />
            ) : (
              <span className="gallery-empty" />
            )}
            <span className="example-text">
              <span className="example-title">{example.title}</span>
              <span className="example-provenance">
                <span className="kind-tag">{KIND_LABEL[example.provenance.kind]}</span>
                {example.provenance.label}
              </span>
            </span>
            <span className="example-action" aria-hidden="true">
              Load in player <span>→</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Without JavaScript: the hero deck's text, step by step, as `make demo` recorded it. */
export function DeckProse({ example }: { example: Example }) {
  const withText = example.states.filter((state) => state.lead || state.body);
  if (withText.length === 0) return null;
  return (
    <div className="no-js-only page-column flex flex-col gap-3 pb-10">
      <h2 className="text-ink text-base font-semibold">{example.title}: the deck's text</h2>
      <div data-nosnippet="">
        <ol className="flex max-w-[44rem] flex-col gap-3">
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
      </div>
      <p>
        <a href={example.href}>Open the example deck</a>
      </p>
    </div>
  );
}
