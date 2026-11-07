export declare const HEAD_LINE_LIMIT: number
export declare function harvestText(
  /** A Playwright Page; typed structurally since playwright-chromium is an optional peer. */
  page: { evaluate(fn: (arg: any) => unknown, arg: any): Promise<any> },
  slide: number | string,
): Promise<{
  entries: { kind: string; text: string }[]
  heads: { text: string; lines: number }[]
}>
export declare function lineCount(rects: { top: number; height: number; width: number }[]): number
export declare function wrapWarning(
  slide: number | string,
  click: number,
  head: { text: string; lines: number },
  limit?: number,
): string | null
