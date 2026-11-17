/// <reference types="vite/client" />

import type { TermPaneSpec } from "@react-decks/core";
import { motionMode } from "@react-decks/motion";
import { useDeck, useSlide, useSlideScale } from "@react-decks/runtime";
import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
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

export function LiveTerm({
  pane,
  click,
  fallback,
}: {
  pane: TermPaneSpec;
  click: number;
  fallback: ReactNode;
}): ReactElement {
  const { isActive, renderContext } = useSlide();
  const { view, embedded } = useDeck();
  const scale = useSlideScale();
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "instant");
  const eligible =
    isActive && renderContext === "slide" && view === "play" && !embedded && mode === "live";
  const live = useLiveTerm(import.meta.hot, pane, eligible, click, isActive);
  const terminalBox = useRef<HTMLDivElement>(null);
  const [Host, setHost] = useState<ComponentType<Parameters<typeof XtermHost>[0]>>();
  useEffect(() => {
    if (!import.meta.hot || !live.live) return;
    const element = terminalBox.current;
    if (!element) return;
    const css = getComputedStyle(element);
    const font = css.getPropertyValue("--deck-term-font").trim() || "monospace";
    let cancelled = false;
    void Promise.all([
      import("./xterm-host"),
      document.fonts.load(`${css.fontSize} ${font}`),
      document.fonts.ready,
    ]).then(
      ([{ XtermHost }]) => {
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
  return (
    <div ref={terminalBox} className={styles.pane}>
      {live.live && Host && live.connection ? (
        <Host connection={live.connection} rows={pane.rows} cols={pane.cols} scale={scale} />
      ) : (
        <>
          {fallback}
          {live.reason && <div role="status">{live.reason}</div>}
        </>
      )}
    </div>
  );
}
