import { relative } from "node:path";
import type { z } from "zod";

export const displayPath = (file: string) => relative(process.cwd(), file) || ".";

/** Author input is reported at the CLI or Vite boundary, never where it is detected. */
export class DeckError extends Error {
  readonly file: string | undefined;
  readonly id: string | undefined;
  constructor(
    message: string,
    file?: string,
    readonly loc?: { line: number; column: number },
    options?: ErrorOptions & { prefix?: boolean },
  ) {
    const path = file === undefined ? undefined : displayPath(file);
    super(
      `${path && options?.prefix !== false ? `${path}${loc ? `:${loc.line}:${loc.column}` : ""}: ` : ""}${message}`,
      options,
    );
    this.name = "DeckError";
    this.file = file;
    this.id = file;
    // Vite otherwise includes the detector's internal stack in the author overlay.
    this.stack = "";
  }
}

export function validationError(
  file: string,
  issues: readonly z.core.$ZodIssue[],
  input: unknown,
  knownKeys: readonly string[] = [],
  frontmatter = false,
): DeckError {
  const lines = issues.flatMap((issue) => {
    const key = issue.path.join(".");
    let value = input;
    for (const part of issue.path) {
      value = typeof value === "object" && value !== null ? Reflect.get(value, part) : undefined;
    }
    const field = `${frontmatter ? "frontmatter " : ""}${key || "config"}`;
    const got =
      typeof value === "number" && !Number.isFinite(value)
        ? String(value)
        : (JSON.stringify(value) ?? String(value));
    if (issue.code === "unrecognized_keys")
      return issue.keys.map(
        (key) => `unknown key ${JSON.stringify(key)}. Known keys: ${knownKeys.join(", ")}.`,
      );
    if (frontmatter && key === "clicks")
      return [`${field} must be a whole number 0 or greater, got ${got}.`];
    if (frontmatter && key === "layers")
      return [`${field} must be false, "above" or "below", got ${got}.`];
    if (issue.code === "invalid_type")
      return [
        value === undefined
          ? `${field} is required (a ${issue.expected}).`
          : `${field} must be ${/^[aeiou]/.test(issue.expected) ? "an" : "a"} ${issue.expected}, got ${got}.`,
      ];
    if (issue.code === "too_small" && issue.origin === "string")
      return [`${field} must not be empty, got ${got}.`];
    return [`${field}: ${issue.message}, got ${got}.`];
  });
  return new DeckError(lines.join(`\n${displayPath(file)}: `), file);
}

export function compileError(cause: unknown, file: string): DeckError {
  if (cause instanceof DeckError) return cause;
  const loc =
    cause instanceof Error &&
    "line" in cause &&
    typeof cause.line === "number" &&
    "column" in cause &&
    typeof cause.column === "number"
      ? { line: cause.line, column: cause.column }
      : undefined;
  const message = cause instanceof Error ? cause.message : String(cause);
  return new DeckError(
    `${message}${/[.!?]$/.test(message) ? "" : "."} Check the slide and its MDX plugins.`,
    file,
    loc,
    { cause },
  );
}

/** Vite and Rolldown may wrap a plugin error while retaining its cause. */
export function authorError(error: unknown): DeckError | undefined {
  if (error instanceof DeckError) return error;
  if (error instanceof Error && error.cause) return authorError(error.cause);
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors)
  ) {
    for (const child of error.errors) {
      const found = authorError(child);
      if (found) return found;
    }
  }
  return undefined;
}
