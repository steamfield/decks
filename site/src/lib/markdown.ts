// Docs Markdown conventions: @steamfield/ui/markdown's Sätteri hast plugins (callouts,
// heading anchors, table scroll regions and code frames with a copy button) plus its
// fence-meta Shiki transformer. astro.config.mjs registers them next to its own dual
// Shiki themes; markdown.test.ts renders through the same processor. global.css styles
// the data-* hooks they emit.
import { codeMeta, createHastPlugins } from "@steamfield/ui/markdown";

export const docsHastPlugins = createHastPlugins({
  headingAnchors: { label: () => "Link to this section" },
});

/** Carries `title="..."` from a fence's info string onto the highlighted `<pre>`. */
export const docsShikiTransformers = [codeMeta()];
