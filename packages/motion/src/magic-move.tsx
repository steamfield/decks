import { useSlide, useSlideScale } from "@react-decks/runtime";
import { ShikiMagicMovePrecompiled } from "@shikijs/magic-move/react";
import type { KeyedTokensInfo } from "@shikijs/magic-move/types";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { duration, motionMode } from "./tokens";
import "./magic-move.css";

/** Compiled fence output; authors write a magic-move fence rather than this component. */
export function MagicMove(props: { steps: string; at: string; ranges: string; title?: string }) {
  const { clicks, isActive, renderContext } = useSlide();
  const scale = useSlideScale();
  const steps = useMemo<KeyedTokensInfo[]>(() => JSON.parse(props.steps), [props.steps]);
  const ranges = useMemo<(number[] | "all" | "none")[][]>(
    () => JSON.parse(props.ranges),
    [props.ranges],
  );
  const at = Number(props.at);
  let remaining = clicks - at;
  let index = 0;
  while (index < steps.length - 1 && remaining >= Math.max(1, ranges[index]?.length ?? 0)) {
    remaining -= Math.max(1, ranges[index]?.length ?? 0);
    index++;
  }
  const range =
    clicks < at
      ? undefined
      : ranges[index]?.[Math.max(0, Math.min(remaining, (ranges[index]?.length ?? 0) - 1))];
  const previous = useRef({ clicks, index, isActive });
  const primed = useRef(false);
  const [rendered, setRendered] = useState<{ index: number; animate: boolean; next?: number }>({
    index,
    animate: false,
  });
  const rendererSteps = useMemo(
    () => (rendered.next === undefined ? steps : steps.map((step) => ({ ...step }))),
    [steps, rendered.next],
  );
  const container = useRef<HTMLElement>(null);
  const options = useMemo(
    () => ({
      duration: rendered.next === undefined ? duration.slow * 1000 : 0,
      globalScale: scale,
      animateContainer: false,
    }),
    [scale, rendered.next],
  );

  // Synchronize the external renderer before paint, including its animate flag on this update.
  useLayoutEffect(() => {
    const animate =
      previous.current.clicks + 1 === clicks &&
      previous.current.index + 1 === index &&
      previous.current.isActive &&
      isActive &&
      renderContext === "slide" &&
      motionMode() === "live";
    const from = previous.current.index;
    previous.current = { clicks, index, isActive };
    // replace() leaves Shiki's first-render flag set. Prime the visible source at zero duration
    // on the first forward click so new tokens fade in during the following morph too.
    if (animate && !primed.current) {
      primed.current = true;
      setRendered({ index: from, animate: true, next: index });
    } else
      setRendered((current) =>
        current.index === index && current.animate === animate && current.next === undefined
          ? current
          : { index, animate },
      );
  }, [clicks, index, isActive, renderContext]);

  useEffect(() => {
    const pre = container.current?.querySelector("pre");
    if (!pre) return;
    const mark = () => {
      let line = 1;
      for (const token of pre.children) {
        if (!(token instanceof HTMLElement) || token.style.position === "absolute") continue;
        if (token.tagName === "BR") {
          line++;
          continue;
        }
        token.dataset.line = String(line);
        if (range === undefined) delete token.dataset.lineState;
        else
          token.dataset.lineState =
            range === "all" || (Array.isArray(range) && range.includes(line)) ? "active" : "dim";
      }
    };
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(pre, { childList: true });
    return () => observer.disconnect();
  }, [range]);

  return (
    <figure className="rd-code rd-magic-move" ref={container}>
      {props.title !== undefined && <figcaption>{props.title}</figcaption>}
      <ShikiMagicMovePrecompiled
        steps={rendererSteps}
        step={rendered.index}
        animate={rendered.animate}
        options={options}
        onEnd={() =>
          setRendered((current) =>
            current.next === undefined ? current : { index: current.next, animate: true },
          )
        }
      />
    </figure>
  );
}
