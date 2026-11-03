// Types for scan.mjs, which stays plain JS so the `decks` bin runs it under
// Node from node_modules.

export type Allow = string[] | '*'

export interface Pattern {
  id: string
  severity: 'error' | 'warn' | string
  message: string
  re: RegExp
  context: RegExp
}

export interface Entry {
  line: number
  allow: Allow
  text: string
}

export interface CopyString extends Entry {
  raw: string
}

export interface Hit {
  id: string
  severity: string
  message: string
  line: number
  match: string
  text: string
}

export declare const PATTERNS_FILE: string
export declare const FIELD: RegExp
export declare function loadPatterns(file?: string): Pattern[]
export declare function proseLines(src: string, opts?: { fragment?: boolean }): Entry[]
export declare function copyLiteral(src: string): { text: string; offset: number } | null
export declare function fieldStrings(src: string, from?: number, to?: number): CopyString[]
export declare function copyStrings(src: string): CopyString[]
export declare function scanEntries(
  entries: Entry[],
  patterns: Pattern[],
  opts?: { errorsOnly?: boolean },
): Hit[]
export declare function scanSource(
  name: string,
  src: string,
  patterns: Pattern[],
  opts?: { errorsOnly?: boolean },
): Hit[]
export declare function formatHit(file: string, hit: Hit): string
