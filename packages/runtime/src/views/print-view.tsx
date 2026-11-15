import type { ReactElement } from "react";
import { SlideFrame } from "../canvas/slide-frame";
import { useDeckContext } from "../hooks";
import { SlideHost } from "../slides/slide-host";
import styles from "./print-view.module.css";

export function PrintView(): ReactElement {
  const { source } = useDeckContext();
  const final = new URLSearchParams(window.location.search).get("print") === "final";
  return (
    <div id="deck-print" className={styles.print}>
      <style>{`@page { size: ${source.manifest.canvas.width}px ${source.manifest.canvas.height}px; }`}</style>
      {source.manifest.slides.flatMap((meta) =>
        Array.from({ length: final ? 1 : meta.clicks + 1 }, (_, index) => {
          const click = final ? meta.clicks : index;
          return (
            <div
              key={`${meta.id}:${click}`}
              className={styles.page}
              style={{ ...source.manifest.canvas }}
            >
              <SlideFrame>
                <SlideHost no={meta.no} clicks={click} context="print" />
              </SlideFrame>
            </div>
          );
        }),
      )}
    </div>
  );
}
