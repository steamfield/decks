import { DeckError } from "../dev/errors";

export function parseCodeOptions(meta: string, lineCount: number, file: string) {
  const options: {
    steps?: (number[] | "all" | "none")[];
    at: number;
    lines?: number;
    title?: string;
    maxHeight?: number;
  } = { at: 0 };
  const seen = new Set<string>();
  const fail = (option: string): never => {
    throw new DeckError(
      `invalid code option ${option}. Use line ranges within this block and whole numbers for at, lines and maxHeight.`,
      file,
    );
  };
  const integer = (value: string, option: string, minimum: number) => {
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum)
      return fail(option);
    return number;
  };
  const tokens = /\s*(\{[^}]*\}|title="[^"]*"|[^\s]+)(?=\s|$)/gy;
  let offset = 0;
  while (meta.slice(offset).trim()) {
    tokens.lastIndex = offset;
    const match = tokens.exec(meta);
    const token = match?.[1];
    if (!token) return fail(meta.slice(offset).trim());
    offset = tokens.lastIndex;
    const key = token.startsWith("{") ? "steps" : token.split("=")[0];
    if (!key || seen.has(key)) return fail(token);
    seen.add(key);
    if (key === "steps") {
      if (!token.endsWith("}")) fail(token);
      options.steps = token
        .slice(1, -1)
        .split("|")
        .map((step) => {
          if (step === "all" || step === "none") return step;
          const lines = new Set<number>();
          for (const range of step.split(",")) {
            const bounds = range.split("-");
            const first = integer(bounds[0] ?? "", token, 1);
            const last = integer(bounds[1] ?? bounds[0] ?? "", token, 1);
            if (bounds.length > 2 || last < first || last > lineCount) fail(token);
            for (let line = first; line <= last; line++) lines.add(line);
          }
          return [...lines];
        });
    } else if (key === "at") options.at = integer(token.slice(3), token, 0);
    else if (key === "lines")
      options.lines = token === "lines" ? 1 : integer(token.slice(6), token, 1);
    else if (key === "maxHeight") options.maxHeight = integer(token.slice(10), token, 1);
    else if (key === "title" && /^title="[^"]*"$/.test(token)) options.title = token.slice(7, -1);
    else fail(token);
  }
  return options;
}
