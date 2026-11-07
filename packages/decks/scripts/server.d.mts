export declare function freePort(start?: number): Promise<number>
export declare function decodeEntities(text: string): string
export declare function existingServer(
  port: number,
  entry: string,
): Promise<{ origin: string; error?: undefined } | { error: string; origin?: undefined }>
export declare function startServer(opts: {
  args: string[]
  cwd: string
  port: number
  entry: string
  timeoutMs?: number
}): Promise<{ origin: string; stop: () => void }>
