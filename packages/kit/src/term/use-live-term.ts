import type { TermPaneSpec } from "@react-decks/core";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  slideActive: boolean,
) {
  const key = JSON.stringify([pane.id, pane.rows, pane.cols, pane.cwd, pane.commands]);
  const [current, setCurrent] = useState(() => ({
    transport,
    key,
    connection: transport ? createConnection(transport, pane) : undefined,
  }));
  // Inline pane objects must not turn each click into a fresh attach.
  if (current.transport !== transport || current.key !== key) {
    setCurrent({
      transport,
      key,
      connection: transport ? createConnection(transport, pane) : undefined,
    });
  }
  const connection = current.connection;
  const state = useSyncExternalStore(
    connection?.subscribe ?? noop,
    connection?.getSnapshot ?? (() => recording),
    () => recording,
  );
  useEffect(() => {
    connection?.navigate(eligible, click, slideActive);
  }, [connection, eligible, click, slideActive]);
  useEffect(() => () => connection?.detach(), [connection]);
  return { ...state, live: eligible && state.live, connection };
}
