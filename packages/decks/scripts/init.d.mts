export type FileStatus = 'written' | 'updated' | 'unchanged' | 'skipped' | 'overwritten' | 'collision'
export interface InitResult {
  code: number
  files: Record<string, FileStatus>
  settings: { notes: string[]; diff: string }
  instructions: string[]
  warnings: string[]
  vars: Record<string, string>
}
export declare function runInit(
  argv?: string[],
  opts?: { rootDir?: string; log?: (s: string) => void; packageDir?: string },
): InitResult
export declare function lineDiff(before: string, after: string): string
export declare function mergeHooks(settings: Record<string, any>, entries: unknown[]): string[]
