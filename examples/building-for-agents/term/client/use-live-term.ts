import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { TermPaneSpec } from "../protocol";
import { createConnection, type TermTransport } from "./connection";

const recording: { live: boolean; busy: boolean; reason: string; queued: readonly number[] } = {
  live: false,
  busy: false,
  reason: "",
  queued: [],
};
const noop = () => () => {};

export function useLiveTerm(
  transport: TermTransport | undefined,
  pane: TermPaneSpec,
  eligible: boolean,
  click: number,
) {
  const connection = useMemo(
    () => (transport ? createConnection(transport, pane) : undefined),
    [transport, pane],
  );
  const state = useSyncExternalStore(
    connection?.subscribe ?? noop,
    connection?.getSnapshot ?? (() => recording),
    () => recording,
  );
  useEffect(() => {
    connection?.navigate(eligible, click);
  }, [connection, eligible, click]);
  useEffect(() => () => connection?.detach(), [connection]);
  return { ...state, live: eligible && state.live, connection };
}
