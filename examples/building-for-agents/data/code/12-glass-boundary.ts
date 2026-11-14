/**
 * Slide 12: the code on the StatGlass boundary slide. Read 2026-11-13 from
 * ~/Projects/statglass at commit 5db8622a. Checked by excerpts.test.ts.
 */
import type { Excerpt } from './types'

const base = { repo: 'statglass', commit: '5db8622a' } as const

/** The Rust side: one command's attributes and signature. */
export const SUBSCRIBE_LIVE_RUST: Excerpt = {
  ...base,
  lang: 'rust',
  path: 'src-tauri/src/commands.rs',
  start: 75,
  end: 85,
  code: `#[tauri::command]
#[specta::specta]
pub async fn subscribe_live(
    // …
    host: HostId,
    channel: tauri::ipc::Channel<LiveMsg>,
    backfill_ms: Option<u32>,
    series: Option<Vec<SeriesSelector>>,
    min_period_ms: Option<u32>,
) -> Result<SubscriptionInfo, CommandError> {`,
}

/** The TypeScript side: the line tauri-specta wrote for it. One source line. */
export const SUBSCRIBE_LIVE_TS: Excerpt = {
  ...base,
  lang: 'ts',
  path: 'src/core/generated/bindings.ts',
  start: 150,
  end: 150,
  code: `subscribeLive: (host: HostId, channel: Channel<LiveMsg>, backfillMs: number | null, series: SeriesSelector[] | null, minPeriodMs: number | null) => typedError<SubscriptionInfo, CommandError>(__TAURI_INVOKE("subscribe_live", { host, channel, backfillMs, series, minPeriodMs })),`,
}

/** The one animation a tick runs: the redrawn chart slides in from one slot over. */
export const TICK_SCROLL: Excerpt = {
  ...base,
  lang: 'ts',
  path: 'src/app/widgets/lib/use-tick-scroll.ts',
  start: 33,
  end: 36,
  code: `const animation = el.animate(
  [{ transform: \`translateX(\${shift})\` }, { transform: "translateX(0)" }],
  { duration, easing: motionEase("tick", el) }
);`,
}
