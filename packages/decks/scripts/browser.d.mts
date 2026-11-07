export declare const HEAD_LINE_LIMIT: number
export declare function lineCount(rects: { top: number; height: number; width: number }[]): number
export declare function wrapWarning(
  slide: number | string,
  click: number,
  head: { text: string; lines: number },
  limit?: number,
): string | null
