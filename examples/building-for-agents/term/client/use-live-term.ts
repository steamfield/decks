import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { TermPaneSpec } from "../protocol";
import { createConnection, type TermTransport } from "./connection";

const recording = { live: false, busy: false, reason: "" };
const noop = () => () => {};

export function useLiveTerm(
  transport: TermTransport | undefined,
  pane: TermPaneSpec,
  eligible: boolean | undefined,
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
    if (eligible !== undefined) connection?.navigate(eligible, click);
  }, [connection, eligible, click]);
  useEffect(() => () => connection?.detach(), [connection]);
  return { ...state, live: eligible && state.live, connection };
}
