import { formatHash } from "@react-decks/core";
import type { ReactElement, ReactNode } from "react";
import { useDeck, useSlide } from "../hooks";

/** A link to slide `to` (architecture section 4.5). */
export function Link({ to, children }: { to: number; children?: ReactNode }): ReactElement {
  const { total, view, go } = useDeck();
  const { renderContext } = useSlide();
  if (!Number.isInteger(to) || to < 1 || to > total)
    throw new Error(`Invalid slide ${to} in a deck with ${total} slides`);
  if (renderContext !== "slide" && renderContext !== "presenter") return <span>{children}</span>;
  return (
    <a
      href={formatHash({ view, slide: to, click: 0 })}
      onClick={(event) => {
        if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
          return;
        event.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}
