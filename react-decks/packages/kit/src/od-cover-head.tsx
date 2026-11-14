import { theme } from "./theme";

export function OdCoverHead({ url, className = "" }: { url?: string; className?: string }) {
  const { brand } = theme();
  const address = url ?? brand.url;
  return (
    <div className={`od-cover-head ${className}`}>
      <div className="od-brand">
        {brand.logo && (
          <svg
            width={46}
            height={46}
            viewBox={brand.logo["view-box"]}
            aria-hidden="true"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is supplied by the deck author's own theme.json.
            dangerouslySetInnerHTML={{ __html: brand.logo.svg }}
          />
        )}
        <span className="od-brand-name">{brand.name}</span>
      </div>
      {address && <span className="od-mono od-cover-url">{address}</span>}
    </div>
  );
}
