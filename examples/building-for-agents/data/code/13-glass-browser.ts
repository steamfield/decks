/**
 * Slide 13: the Transport interface. Read 2026-11-13 from ~/Projects/statglass
 * at commit 5db8622a. Checked by excerpts.test.ts.
 */
import type { Excerpt } from './types'

/** The interface every screen calls, trimmed to one request and the live stream. */
export const TRANSPORT_INTERFACE: Excerpt = {
  repo: 'statglass',
  commit: '5db8622a',
  lang: 'ts',
  path: 'src/core/transport/contracts.ts',
  start: 121,
  end: 471,
  code: `export interface Transport {
  readonly kind: "tauri" | "mock";
  // …
  getHost(host: HostId): Promise<CommandResult<HostRecord>>;
  // …
  subscribeLive(
    host: HostId,
    onMsg: (msg: LiveMsg) => void,
    options?: LiveOptions
  ): Promise<LiveSubscription>;
  // …
}`,
}
