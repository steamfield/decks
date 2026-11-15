import type { ReactNode } from "react";

export function OdEyebrow({ accent, children }: { accent?: string; children?: ReactNode }) {
  return (
    <div className="od-eyebrow-row">
      <span className="od-eyebrow-rule" />
      <span className={`od-eyebrow${accent ? ` ${accent}` : ""}`}>{children}</span>
    </div>
  );
}
