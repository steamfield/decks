// Docs Markdown conventions: @steamfield/ui/markdown's Sätteri hast plugins (callouts,
// heading anchors, table scroll regions and code frames with a copy button) plus its
// fence-meta Shiki transformer. astro.config.mjs registers them next to its own dual
// Shiki themes; markdown.test.ts renders through the same processor. global.css styles
// the data-* hooks they emit.
import { codeMeta, createHastPlugins } from "@steamfield/ui/markdown";
import { defineHastPlugin, type HastPluginEntry } from "satteri";
import { guideLink } from "./guide";

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

export const docsHastPlugins = [
  guidePage,
  ...createHastPlugins({
    headingAnchors: { label: () => "Link to this section" },
  }),
];

/** Carries `title="..."` from a fence's info string onto the highlighted `<pre>`. */
export const docsShikiTransformers = [codeMeta()];
