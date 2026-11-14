import { type StepState, stepState } from "@react-decks/core";
import { useSlide } from "@react-decks/runtime";
import {
  Children,
  type CSSProperties,
  cloneElement,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
} from "react";

export type StepPreset = "fade" | "rise" | "drop" | "scale" | "blur" | "wipe";
type StepElement = "div" | "span" | "li" | "p" | "g";

export function useStepState(at: number, until?: number): StepState {
  return stepState(useSlide().clicks, at, until);
}

function stepAttributes(state: StepState, enter: StepPreset = "fade", exit: StepPreset = "fade") {
  const hidden = state === "before" || state === "gone";
  return {
    "data-step-state": state,
    "data-step-enter": enter,
    "data-step-exit": exit,
    "aria-hidden": hidden ? true : undefined,
    inert: hidden ? true : undefined,
  };
}

export function Step({
  at,
  until,
  enter,
  exit,
  as: Element = "div",
  className,
  children,
}: {
  at: number;
  until?: number;
  enter?: StepPreset;
  exit?: StepPreset;
  as?: StepElement;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Element
      {...stepAttributes(useStepState(at, until), enter, exit)}
      className={className}
      style={Element === "span" ? { display: "inline-block" } : undefined}
    >
      {children}
    </Element>
  );
}

export function Steps({
  from,
  enter,
  as: Element = "div",
  className,
  children,
}: {
  from: number;
  enter?: StepPreset;
  as?: "div" | "ul" | "ol";
  className?: string;
  children?: ReactNode;
}) {
  const { clicks } = useSlide();
  const contents = Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim() !== "",
  );
  const list = contents[0];
  if (
    contents.length === 1 &&
    isValidElement<HTMLAttributes<HTMLElement>>(list) &&
    (list.type === "ul" || list.type === "ol")
  ) {
    let index = 0;
    return cloneElement(
      list,
      { className: [list.props.className, className].filter(Boolean).join(" ") || undefined },
      Children.map(list.props.children, (child) =>
        isValidElement<HTMLAttributes<HTMLLIElement>>(child) && child.type === "li"
          ? cloneElement(child, stepAttributes(stepState(clicks, from + index++), enter))
          : child,
      ),
    );
  }
  return (
    <Element className={className}>
      {Children.map(contents, (child, index) => (
        <Step at={from + index} enter={enter} as={Element === "div" ? "div" : "li"}>
          {child}
        </Step>
      ))}
    </Element>
  );
}

interface PieceStyle extends CSSProperties {
  "--step-index": number;
}
function pieceStyle(index: number): PieceStyle {
  return { "--step-index": index };
}

// Only the pieces move; the container still owns the group's accessibility and visibility.
const groupStyle: CSSProperties = {
  opacity: 1,
  transform: "none",
  filter: "none",
  clipPath: "none",
};

export function Stagger({
  at,
  until,
  enter,
  as: Element = "div",
  className,
  children,
}: {
  at: number;
  until?: number;
  enter?: StepPreset;
  as?: "div" | "ul" | "ol";
  className?: string;
  children?: ReactNode;
}) {
  const attrs = stepAttributes(useStepState(at, until), enter);
  const Item = Element === "div" ? "div" : "li";
  return (
    <Element {...attrs} style={groupStyle} className={className}>
      {Children.map(children, (child, index) => (
        <Item {...attrs} style={pieceStyle(index)}>
          {child}
        </Item>
      ))}
    </Element>
  );
}

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function TextReveal({
  at,
  by = "word",
  enter,
  children,
}: {
  at: number;
  by?: "word" | "char";
  enter?: StepPreset;
  children: string;
}) {
  const attrs = stepAttributes(useStepState(at), enter);
  const pieces =
    by === "char"
      ? Array.from(graphemes.segment(children), ({ segment }) => segment)
      : children.split(/(\s+)/);
  let index = 0;
  return (
    <span {...attrs} style={{ ...groupStyle, whiteSpace: "pre-wrap" }}>
      <span className="rd-visually-hidden">{children}</span>
      <span aria-hidden="true">
        {Children.map(pieces, (piece) => {
          if (by === "word" && /^\s+$/.test(piece)) return piece;
          if (!piece) return null;
          return (
            <span
              {...attrs}
              aria-hidden="true"
              style={{
                ...pieceStyle(index++),
                display: /[\r\n]/.test(piece) ? "contents" : "inline-block",
                whiteSpace: "pre",
              }}
            >
              {piece}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export function Highlight({
  at,
  until,
  children,
}: {
  at: number;
  until?: number;
  children?: ReactNode;
}) {
  return (
    <mark data-step-state={useStepState(at, until)} data-step-enter="fade" data-step-exit="fade">
      {children}
    </mark>
  );
}

export function Draw({
  at,
  until,
  children,
}: {
  at: number;
  until?: number;
  children?: ReactNode;
}) {
  const shapes = new Set(["path", "line", "polyline", "polygon", "circle", "ellipse", "rect"]);
  return (
    <g {...stepAttributes(useStepState(at, until))} className="rd-draw">
      {Children.map(children, (child) =>
        isValidElement<{ pathLength?: number }>(child) &&
        typeof child.type === "string" &&
        shapes.has(child.type)
          ? cloneElement(child, { pathLength: 1 })
          : child,
      )}
    </g>
  );
}
