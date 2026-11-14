import { useSlide } from "@react-decks/runtime";
import type { ReactElement, ReactNode } from "react";

export function Morph({
  name,
  as: Element = "div",
  className,
  children,
}: {
  name: string;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "p" | "figure" | "g";
  className?: string;
  children?: ReactNode;
}): ReactElement {
  const { isActive, renderContext } = useSlide();
  if (
    !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name) ||
    /^(none|auto|match-element|root|initial|inherit|unset|revert|revert-layer|default)$/i.test(name)
  )
    throw new Error(`Invalid Morph name ${JSON.stringify(name)}`);
  return (
    <Element
      className={className}
      style={isActive && renderContext === "slide" ? { viewTransitionName: name } : undefined}
    >
      {children}
    </Element>
  );
}
