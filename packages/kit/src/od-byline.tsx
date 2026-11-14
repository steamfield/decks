import type { ReactNode } from "react";

export function OdByline({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`od-mono od-byline ${className}`}>{children}</div>;
}
