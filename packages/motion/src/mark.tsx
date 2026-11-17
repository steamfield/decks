import {
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import { useStepState } from "./steps";
import "./mark.css";

export type MarkKind = "underline" | "circle" | "box" | "strike" | "cross" | "bracket";

const kinds = new Set<MarkKind>(["underline", "circle", "box", "strike", "cross", "bracket"]);

/** A hand-drawn mark around its children, drawn on a click (architecture section 5.3). */
export function Mark({
  kind = "underline",
  at,
  until,
  color = "currentColor",
  children,
}: {
  kind?: MarkKind;
  at: number;
  until?: number;
  color?: string;
  children?: ReactNode;
}): ReactElement {
  const state = useStepState(at, until);
  const ref = useRef<HTMLSpanElement>(null);
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const width = root.offsetWidth;
      const height = root.offsetHeight;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const outset = kind === "circle" || kind === "box" || kind === "bracket" ? height * 0.1 : 0;
  const paths = useMemo(() => {
    if (!kinds.has(kind)) throw new Error(`Unknown Mark kind "${kind}"`);
    if (!width || !height) return [];
    const generator = rough.generator({ options: { seed: 53, roughness: 0.7, bowing: 1 } });
    let shapes: Record<string, ReturnType<typeof generator.line>>;
    switch (kind) {
      case "underline":
        shapes = { stroke: generator.line(0, height * 0.95, width, height * 0.95) };
        break;
      case "circle":
        shapes = {
          stroke: generator.ellipse(width / 2, height / 2, width + outset * 2, height + outset * 2),
        };
        break;
      case "box":
        shapes = {
          stroke: generator.rectangle(-outset, -outset, width + outset * 2, height + outset * 2),
        };
        break;
      case "strike":
        shapes = { stroke: generator.line(0, height / 2, width, height / 2) };
        break;
      case "cross":
        shapes = {
          descending: generator.line(0, 0, width, height),
          ascending: generator.line(0, height, width, 0),
        };
        break;
      case "bracket":
        shapes = {
          left: generator.linearPath([
            [0, -outset],
            [-outset, -outset],
            [-outset, height + outset],
            [0, height + outset],
          ]),
          right: generator.linearPath([
            [width, -outset],
            [width + outset, -outset],
            [width + outset, height + outset],
            [width, height + outset],
          ]),
        };
        break;
    }
    return Object.entries(shapes).map(([id, shape]) => ({
      id,
      d: generator
        .toPaths(shape)
        .map(({ d }) => d)
        .join(" "),
    }));
  }, [kind, width, height, outset]);
  return (
    <span
      ref={ref}
      className="rd-mark"
      data-step-state={state}
      data-step-enter="fade"
      data-step-exit="fade"
    >
      {children}
      {width > 0 && height > 0 && (
        <svg
          aria-hidden="true"
          viewBox={`${-outset} ${-outset} ${width + outset * 2} ${height + outset * 2}`}
          style={{
            left: -outset,
            top: -outset,
            width: width + outset * 2,
            height: height + outset * 2,
          }}
        >
          {paths.map(({ id, d }) => (
            <path key={`${kind}:${id}`} d={d} pathLength="1" fill="none" stroke={color} />
          ))}
        </svg>
      )}
    </span>
  );
}
