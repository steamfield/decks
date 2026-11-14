import { OdLogo } from "./od-logo";
import { theme } from "./theme";

export function OdCoverHead({ url, className = "" }: { url?: string; className?: string }) {
  const { brand } = theme();
  const address = url ?? brand.url;
  return (
    <div className={`od-cover-head ${className}`}>
      <div className="od-brand">
        <OdLogo size={46} />
        <span className="od-brand-name">{brand.name}</span>
      </div>
      {address && <span className="od-mono od-cover-url">{address}</span>}
    </div>
  );
}
