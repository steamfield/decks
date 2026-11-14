import { encode } from "uqr";

export function OdQrCard({
  url,
  image,
  label,
  sublabel,
  ariaLabel,
}: {
  url?: string;
  image?: string;
  label?: string;
  sublabel?: string;
  ariaLabel?: string;
}) {
  const qr = url ? encode(url, { ecc: "M", border: 0 }) : null;
  const path = qr?.data
    .flatMap((row, y) =>
      row.flatMap((dark, x) => (dark ? [`M${x * 10},${y * 10}h10v10h-10z`] : [])),
    )
    .join("");
  return (
    <div className="od-qr-card">
      <div
        className="od-qr-frame"
        role="img"
        aria-label={ariaLabel ?? `QR code${label ? ` to ${label}` : ""}`}
      >
        {qr ? (
          <div className="od-qr-img">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${qr.size * 10} ${qr.size * 10}`}
            >
              <rect fill="white" width={qr.size * 10} height={qr.size * 10} />
              <path fill="black" d={path} />
            </svg>
          </div>
        ) : (
          <div
            className="od-qr-img"
            style={{
              background: image ? `url('${image}') center/contain no-repeat` : "",
            }}
          />
        )}
      </div>
      {label && <span className="od-eyebrow od-qr-label">{label}</span>}
      {sublabel && <span className="od-mono od-qr-sublabel">{sublabel}</span>}
    </div>
  );
}
