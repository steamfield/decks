import rehypeShiki from "@shikijs/rehype";
import { bundledLanguages, createCssVariablesTheme, isSpecialLang } from "shiki";
import { unified } from "unified";
import { parseCodeOptions } from "./code-options";
import { compileMagicMoves } from "./magic-move";

export const codeBlocks: typeof rehypeShiki = () => async (tree, file) => {
  await compileMagicMoves(tree, file);
  const warn = (node: typeof tree | (typeof tree.children)[number]): void => {
    if (node.type === "element" && node.tagName === "code") {
      const classes = node.properties.className;
      const language = Array.isArray(classes)
        ? classes.find((value) => typeof value === "string" && value.startsWith("language-"))
        : undefined;
      if (typeof language === "string") {
        const name = language.slice(9);
        if (!(name in bundledLanguages) && !isSpecialLang(name))
          console.warn(`${file.path}: unknown code language ${name}; using plain text`);
      }
    }
    if ("children" in node) for (const child of node.children) warn(child);
  };
  warn(tree);
  return unified()
    .use(rehypeShiki, {
      theme: createCssVariablesTheme(),
      defaultLanguage: "text",
      fallbackLanguage: "text",
      tabindex: false,
      transformers: [
        {
          pre(node) {
            const options = parseCodeOptions(
              this.options.meta?.__raw ?? "",
              this.source.split("\n").length,
              file.path,
            );
            node.properties["data-at"] = options.at;
            if (options.steps) node.properties["data-steps"] = JSON.stringify(options.steps);
            if (options.lines !== undefined) node.properties["data-lines"] = options.lines;
            if (options.title !== undefined) node.properties["data-title"] = options.title;
            if (options.maxHeight !== undefined)
              node.properties["data-max-height"] = options.maxHeight;
          },
          line(node, line) {
            node.properties["data-line"] = line;
            // The displayed number is an attribute, not a CSS counter, so it can be read back.
            // Shiki calls this hook before `pre`, so the options are parsed here too.
            const first = parseCodeOptions(
              this.options.meta?.__raw ?? "",
              this.source.split("\n").length,
              file.path,
            ).lines;
            if (first !== undefined) node.properties["data-line-number"] = first + line - 1;
          },
        },
      ],
    })
    .run(tree, file);
};
