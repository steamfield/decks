// Docs Markdown conventions: @steamfield/ui/markdown's Sätteri hast plugins (callouts,
// heading anchors, table scroll regions and code frames with a copy button) plus its
// fence-meta Shiki transformer. astro.config.mjs registers them next to its own dual
// Shiki themes; markdown.test.ts renders through the same processor. global.css styles
// the data-* hooks they emit.
import { codeMeta, createHastPlugins } from "@steamfield/ui/markdown";
import { defineHastPlugin, type HastPluginEntry } from "satteri";
import type { ShikiTransformer } from "shiki";
import { demoPlayer } from "../data/demo-examples";
import { parseDemo } from "../data/guide-demos";
import { guideLink } from "./guide";
import { DEMO_SIZES, posterSrcset } from "./player/example";

const guidePage: HastPluginEntry = ({ fileURL }) =>
  fileURL?.pathname.includes("/docs/guide/")
    ? defineHastPlugin({
        name: "package-guide-page",
        element: {
          filter: ["h1", "a"],
          visit(node, context) {
            // DocsLayout supplies the title; keep the guide unchanged on disk.
            if (node.tagName === "h1") context.removeNode(node);
            if (node.tagName === "a" && typeof node.properties.href === "string")
              context.setProperty(node, "href", guideLink(node.properties.href));
          },
        },
      })
    : null;

type HastElement = {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
};
type HastNode = HastElement | { type: "text"; value: string };
const el = (
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[] = [],
): HastElement => ({ type: "element", tagName, properties, children });
const isElement = (node: unknown): node is HastElement =>
  typeof node === "object" && node !== null && (node as HastElement).type === "element";

/** Marks a fence whose info string carries `demo="deck/slide"` (see src/data/guide-demos.ts). */
const demoMeta: ShikiTransformer = {
  name: "deck-demo-meta",
  pre(node) {
    const ref = parseDemo(this.options.meta?.__raw);
    if (ref) node.properties["data-demo"] = `${ref.deck}/${ref.first}..${ref.last}`;
  },
};

/**
 * Turns a framed demo fence into a figure: the demo's poster (the server-rendered, no-JavaScript
 * state) above the code. src/scripts/deck-demos.ts mounts the live player over the poster.
 */
const deckDemos: HastPluginEntry = () =>
  defineHastPlugin({
    name: "deck-demos",
    element: {
      filter: ["figure"],
      visit(node, context) {
        const pre = (node.children as unknown[]).find(
          (child): child is HastElement => isElement(child) && child.tagName === "pre",
        );
        const marked = pre?.properties["data-demo"] ?? pre?.properties.dataDemo;
        if (!pre || typeof marked !== "string") return;
        const [deck, span] = marked.split("/");
        const [first, last] = (span ?? "").split("..");
        if (!deck || !first || !last) throw new Error(`Malformed demo marker ${marked}`);
        // Sätteri's nodes are read-only: frame a copy of the code without the marker.
        const { "data-demo": _marker, dataDemo: _camel, ...properties } = pre.properties;
        const code = {
          ...(node as unknown as HastElement),
          children: (node.children as unknown as HastNode[]).map((child) =>
            child === pre ? { ...pre, properties } : child,
          ),
        };
        const { example, range } = demoPlayer({ deck, first, last });
        const poster = example.poster;
        const stage = poster
          ? el("picture", {}, [
              el("source", {
                type: "image/avif",
                srcSet: posterSrcset(poster, "avif"),
                sizes: DEMO_SIZES,
              }),
              el("source", {
                type: "image/webp",
                srcSet: posterSrcset(poster, "webp"),
                sizes: DEMO_SIZES,
              }),
              el("img", {
                src: `${poster.base}-1280.webp`,
                width: poster.width,
                height: poster.height,
                alt: example.title,
                loading: "lazy",
                decoding: "async",
              }),
            ])
          : el("p", {}, [{ type: "text", value: "Run make demo to shoot this demo's poster." }]);
        context.replaceNode(
          node as never,
          el("figure", { className: ["deck-demo", "not-prose"], dataDeckDemo: "" }, [
            el(
              "div",
              {
                className: ["deck-demo-stage"],
                dataDeckDemoPlayer: JSON.stringify({ example, range }),
              },
              [stage],
            ),
            code,
            el("figcaption", {}, [
              { type: "text", value: "Live demo: " },
              el(
                "a",
                {
                  href: `${example.href}#/${range.first}`,
                  target: "_blank",
                  rel: "noopener",
                },
                [{ type: "text", value: "open this slide in a new tab" }],
              ),
            ]),
          ]) as never,
        );
      },
    },
  });

export const docsHastPlugins = [
  guidePage,
  ...createHastPlugins({
    headingAnchors: { label: () => "Link to this section" },
  }),
  deckDemos,
];

/** Carries `title="..."` and `demo="..."` from a fence's info string onto the highlighted `<pre>`. */
export const docsShikiTransformers = [codeMeta(), demoMeta];
