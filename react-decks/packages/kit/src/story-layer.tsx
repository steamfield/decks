import type { ReactNode } from "react";

export function StoryLayer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`od-stage-layer ${className}`}>
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {children}
      </svg>
    </div>
  );
}
