/// <reference types="vite/client" />

import type { TermPaneSpec } from "@react-decks/core";
import { motionMode } from "@react-decks/motion";
import { useDeck, useSlide, useSlideScale } from "@react-decks/runtime";
import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import styles from "./live-term.module.css";
import { useLiveTerm } from "./use-live-term";
import type { XtermHost } from "./xterm-host";

function subscribeMotion(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-deck-motion"],
  });
  return () => observer.disconnect();
}

/** What a deck's `frame` needs to label the pane (architecture section 7.2). */
export interface LiveTermStatus {
  live: boolean;
  busy: boolean;
  queued: boolean;
  reason?: string;
}

export function LiveTerm({
  pane,
  click,
  fallback,
  frame,
}: {
  pane: TermPaneSpec;
  click: number;
  fallback: ReactNode;
  frame?: (content: ReactNode, status: LiveTermStatus) => ReactNode;
}): ReactElement {
  const { isActive, renderContext } = useSlide();
  const { view, embedded } = useDeck();
  const scale = useSlideScale();
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "instant");
  const eligible =
    isActive && renderContext === "slide" && view === "play" && !embedded && mode === "live";
  const live = useLiveTerm(import.meta.hot, pane, eligible, click, isActive);
  const [drawn, setDrawn] = useState(false);
  const [Host, setHost] = useState<ComponentType<Parameters<typeof XtermHost>[0]>>();
  useEffect(() => {
    if (!import.meta.hot || !live.live) return;
    let cancelled = false;
    void import("./xterm-host").then(
      ({ XtermHost }) => {
        if (!cancelled) setHost(() => XtermHost);
      },
      (error: unknown) => {
        if (!cancelled)
          live.connection?.unavailable(
            `terminal could not load: ${error instanceof Error ? error.message : String(error)}`,
          );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [live.live, live.connection]);
  const showingLive = live.live && drawn;
  const content = (
    <div className={styles.content}>
      {!showingLive && fallback}
      {live.live && Host && live.connection && (
        <div className={showingLive ? styles.shell : styles.loading}>
          <Host
            connection={live.connection}
            rows={pane.rows}
            cols={pane.cols}
            scale={scale}
            onReady={setDrawn}
          />
        </div>
      )}
    </div>
  );
  return (
    <div className={styles.pane}>
      {frame ? (
        frame(content, {
          live: showingLive,
          busy: live.busy,
          queued: live.queued.length > 0,
          ...(live.reason ? { reason: live.reason } : {}),
        })
      ) : (
        <>
          {content}
          {!showingLive && live.reason && <div role="status">{live.reason}</div>}
        </>
      )}
    </div>
  );
}
