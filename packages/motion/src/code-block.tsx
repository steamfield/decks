import { useSlide, useSlideScale } from "@react-decks/runtime";
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

export function CodeBlock(props: ComponentProps<"pre">) {
  const { clicks, isActive, renderContext } = useSlide();
  const scale = useSlideScale();
  const pre = useRef<HTMLPreElement>(null);
  const rawSteps = "data-steps" in props ? props["data-steps"] : undefined;
  const steps = useMemo<(number[] | "all" | "none")[]>(
    () => (typeof rawSteps === "string" ? JSON.parse(rawSteps) : []),
    [rawSteps],
  );
  const at = "data-at" in props ? Number(props["data-at"]) : 0;
  const index = clicks < at ? -1 : Math.min(clicks - at, steps.length - 1);
  const step = steps[index];
  const title = "data-title" in props ? String(props["data-title"]) : undefined;
  const maxHeight = "data-max-height" in props ? Number(props["data-max-height"]) : undefined;
  const lines = "data-lines" in props ? Number(props["data-lines"]) : undefined;
  const height: CSSProperties & { "--deck-code-max-height": string } = {
    "--deck-code-max-height": maxHeight === undefined ? "none" : `${maxHeight}px`,
  };
  const mark = (children: ReactNode): ReactNode =>
    Children.map(children, (child) => {
      if (
        !isValidElement<{
          children?: ReactNode;
          "data-line"?: number;
          "data-line-state"?: string;
        }>(child)
      )
        return child;
      const line = child.props["data-line"];
      return cloneElement(child, {
        ...(line === undefined
          ? {}
          : {
              "data-line-state":
                step === undefined
                  ? undefined
                  : step === "all" || (Array.isArray(step) && step.includes(Number(line)))
                    ? "active"
                    : "dim",
            }),
        children: mark(child.props.children),
      });
    });

  useLayoutEffect(() => {
    const block = pre.current;
    if (!block) return;
    const measure = () => {
      if (block.scrollHeight > block.clientHeight || block.scrollWidth > block.clientWidth)
        block.tabIndex = 0;
      else block.removeAttribute("tabindex");
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(block);
    if (block.firstElementChild) observer.observe(block.firstElementChild);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const block = pre.current;
    if (!block || maxHeight === undefined || step === undefined) return;
    if (renderContext === "print" || (renderContext === "slide" && !isActive)) return;
    const active = block.querySelector('[data-line-state="active"]');
    if (!active) return;
    const bounds = block.getBoundingClientRect();
    const line = active.getBoundingClientRect();
    const margin = 12;
    if (line.top < bounds.top + margin * scale)
      block.scrollTop += (line.top - bounds.top) / scale - margin;
    else if (line.bottom > bounds.bottom - margin * scale)
      block.scrollTop += (line.bottom - bounds.bottom) / scale + margin;
  }, [step, maxHeight, scale, isActive, renderContext]);

  return (
    <figure className="rd-code" style={height}>
      {title !== undefined && <figcaption>{title}</figcaption>}
      <pre {...props} ref={pre}>
        {mark(props.children)}
      </pre>
    </figure>
  );
}
