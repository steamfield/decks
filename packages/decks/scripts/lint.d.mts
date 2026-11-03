type Decks = Record<string, { entry?: unknown }> | null
export declare function deckFiles(deckDir: string): string[]
export declare function lintFiles(
  files: string[],
  opts: { rootDir: string; errorsOnly?: boolean; log?: (s: string) => void },
): { errors: number; warns: number }
export declare function lintText(
  text: string,
  opts?: { errorsOnly?: boolean; log?: (s: string) => void },
): { errors: number; warns: number }
export declare function allDeckDirs(opts: { rootDir: string; decks?: Decks; decksDir?: string }): string[]
export declare function lintCommand(
  args: string[],
  opts: {
    rootDir: string
    decks: Decks
    decksDir: string
    die: (msg: string) => never
    noRegistry?: string
    log?: (s: string) => void
  },
): Promise<void>
