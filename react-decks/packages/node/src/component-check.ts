import { DeckError } from "./errors";

const provided = [
  "Step",
  "Steps",
  "Stagger",
  "TextReveal",
  "Highlight",
  "CountUp",
  "Draw",
  "Morph",
  "Center",
  "Cover",
  "Section",
  "TwoCol",
  "ImageSide",
  "Notes",
];

interface Node {
  type?: string;
  name?: unknown;
  position?: { start: { line: number; column: number } };
  loc?: { start: { line: number; column: number } };
  children?: Node[];
  data?: { estree?: { body?: Node[] } };
}

/** MDX's own tree keeps code fences out of the JSX name check. */
export function checkComponents(names: () => ReadonlySet<string>) {
  return () => (tree: Node, file: { path: string }) => {
    const known = new Set([...provided, ...names()]);
    const bind = (value: unknown): void => {
      if (typeof value !== "object" || value === null) return;
      if (
        "type" in value &&
        value.type === "Identifier" &&
        "name" in value &&
        typeof value.name === "string"
      )
        known.add(value.name);
      else
        for (const child of Object.values(value)) {
          if (Array.isArray(child)) child.forEach(bind);
          else bind(child);
        }
    };
    for (const node of tree.children ?? []) {
      if (node.type !== "mdxjsEsm") continue;
      const declarations = (value: unknown): void => {
        if (typeof value !== "object" || value === null) return;
        if ("type" in value) {
          if (
            value.type === "ImportDeclaration" &&
            "specifiers" in value &&
            Array.isArray(value.specifiers)
          )
            for (const specifier of value.specifiers) {
              if (typeof specifier === "object" && specifier !== null && "local" in specifier)
                bind(specifier.local);
            }
          if (
            ["VariableDeclarator", "FunctionDeclaration", "ClassDeclaration"].includes(
              String(value.type),
            ) &&
            "id" in value
          )
            bind(value.id);
        }
        for (const child of Object.values(value)) {
          if (Array.isArray(child)) child.forEach(declarations);
          else declarations(child);
        }
      };
      declarations(node.data?.estree);
    }
    const check = (name: unknown, loc?: { line: number; column: number }) => {
      if (typeof name !== "string" || !/^[A-Z][\w]*$/.test(name) || known.has(name)) return;
      throw new DeckError(
        `<${name}> is not defined. Export it from a file in components/ or import it in the slide.`,
        file.path,
        loc,
      );
    };
    const walk = (value: unknown): void => {
      if (typeof value !== "object" || value === null) return;
      const node: Node = value;
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement")
        check(node.name, node.position?.start);
      if (
        node.type === "JSXOpeningElement" &&
        typeof node.name === "object" &&
        node.name !== null &&
        "name" in node.name
      )
        check(
          node.name.name,
          node.loc ? { line: node.loc.start.line, column: node.loc.start.column + 1 } : undefined,
        );
      for (const child of Object.values(value)) {
        if (Array.isArray(child)) child.forEach(walk);
        else walk(child);
      }
    };
    walk(tree);
  };
}
