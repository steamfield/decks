import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import "./layouts.css";

export function Center({ children }: { children?: ReactNode }): ReactElement {
  return (
    <div className="rd-layout" data-deck-layout="center">
      {children}
    </div>
  );
}

export function Cover({ children }: { children?: ReactNode }): ReactElement {
  return (
    <div className="rd-layout" data-deck-layout="cover">
      {children}
    </div>
  );
}

export function Section({ children }: { children?: ReactNode }): ReactElement {
  return (
    <div className="rd-layout" data-deck-layout="section">
      {children}
    </div>
  );
}

const columns = {
  "1:1": "1fr 1fr",
  "2:1": "2fr 1fr",
  "1:2": "1fr 2fr",
  "3:2": "3fr 2fr",
  "2:3": "2fr 3fr",
};

export function TwoCol({
  ratio = "1:1",
  align = "start",
  children,
}: {
  ratio?: "1:1" | "2:1" | "1:2" | "3:2" | "2:3";
  align?: "start" | "center" | "end";
  children?: ReactNode;
}): ReactElement {
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length !== 2)
    throw new Error(`TwoCol requires two element children; received ${elements.length}`);
  return (
    <div
      className="rd-layout"
      data-deck-layout="two-col"
      style={{ gridTemplateColumns: columns[ratio], alignItems: align }}
    >
      {elements}
    </div>
  );
}

export function ImageSide({
  src,
  alt,
  side = "left",
  ratio = "1:1",
  children,
}: {
  src: string;
  alt: string;
  side?: "left" | "right";
  ratio?: "1:1" | "2:1" | "1:2";
  children?: ReactNode;
}): ReactElement {
  return (
    <div
      className="rd-layout"
      data-deck-layout="image-side"
      style={{ gridTemplateColumns: columns[ratio] }}
    >
      <img src={src} alt={alt} style={{ gridColumn: side === "left" ? 1 : 2 }} />
      <div className="rd-image-content" style={{ gridColumn: side === "left" ? 2 : 1 }}>
        {children}
      </div>
    </div>
  );
}
