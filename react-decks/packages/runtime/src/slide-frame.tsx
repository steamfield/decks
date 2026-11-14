import { fitCanvas } from "@react-decks/core";
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SlideScaleContext, useDeckContext } from "./hooks";

export function SlideFrame({
  main,
  children,
}: {
  main?: boolean;
  children: ReactNode;
}): ReactElement {
  const { source } = useDeckContext();
  const { width, height } = source.manifest.canvas;
  const frame = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const fit = fitCanvas(container.width, container.height, width, height);
  useLayoutEffect(() => {
    const parent = frame.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainer({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  const style: CSSProperties & Record<`--deck-${string}`, number> = {
    width: fit.width,
    height: fit.height,
    transform: `scale(${fit.scale})`,
    transformOrigin: "top left",
    containerType: "size",
    "--deck-w": fit.width,
    "--deck-h": fit.height,
    "--deck-scale": fit.scale,
    "--deck-text-scale": 1,
  };
  return (
    <div ref={frame} className="rd-frame" id={main ? "deck-frame" : undefined} style={style}>
      <SlideScaleContext value={fit.scale}>{children}</SlideScaleContext>
    </div>
  );
}
