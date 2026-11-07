export declare const RULES: string[]
export declare function normalize(text: string): string
export declare function deckSourceFiles(deckDir: string): string[]
export declare function deckSlides(
  slidesMd: string,
): { src: string | null; line: number; content: string }[]
export declare function slidePages(slidesMd: string): (string | null)[]
export declare function relatedFiles(deckDir: string, page: string): Map<string, number>
export interface SourceIndex {
  lines: { file: string; line: number; text: string }[]
  all: string
}
export declare function sourceIndex(files: Record<string, string>): SourceIndex
export declare function locate(
  text: string,
  index: SourceIndex,
  related?: Map<string, number>,
): { file: string; line: number; exact: boolean } | null
export declare function noteSections(
  src: string,
): { click: number | string; text: string; line: number }[]
export declare function clickList(clicks: number[]): string
export declare function ruleText(
  rootDir: string,
  name: string,
  opts?: { decksDir?: string },
): { from: string; text: string }
export declare function reviewPrompt(opts: {
  rootDir: string
  deck: { entry: string }
  alias: string
  frames: { slide: number; click: number; entries: { kind: string; text: string }[] }[]
  decksDir?: string
}): string
