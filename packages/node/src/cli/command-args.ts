/**
 * Argument checks shared by the capture commands (`shot`, `film`, `inspect`), which read their
 * own raw arguments because citty accepts unknown flags and extra positionals silently.
 */
import { type ParseArgsOptionsConfig, parseArgs } from "node:util";
import { DeckError } from "../dev/errors";

/** The positionals in `args`; an unknown or malformed flag is a `DeckError` naming it. */
export function commandPositionals(args: string[], options: ParseArgsOptionsConfig): string[] {
  try {
    return parseArgs({ args, options, allowPositionals: true }).positionals;
  } catch (cause) {
    throw new DeckError(
      cause instanceof Error ? cause.message : String(cause),
      undefined,
      undefined,
      { cause },
    );
  }
}

/** `value` as a whole number of at least `min`; anything else is a `DeckError` naming `name`. */
export function wholeNumber(value: string, name: string, min: number): number {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min)
    throw new DeckError(`Invalid ${name} "${value}". Use a whole number ${min} or greater.`);
  return number;
}
