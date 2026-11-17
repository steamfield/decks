import type { ReactElement } from "react";
import { useDeck } from "../hooks";
import { Link } from "./link";

/** Every slide's title as a link, the current one marked (architecture section 4.5). */
export function Toc(): ReactElement {
  const { slides, slide } = useDeck();
  return (
    <ol>
      {slides.map((meta) => (
        <li key={meta.id} aria-current={meta.no === slide ? "page" : undefined}>
          <Link to={meta.no}>{meta.title || meta.no}</Link>
        </li>
      ))}
    </ol>
  );
}
