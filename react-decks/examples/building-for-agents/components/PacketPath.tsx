import { along, type Pt, polyline } from "./design";

/** A packet appears only while travelling between the polyline's endpoints. */
export function PacketPath({
  points,
  progress,
  color,
  radius = 9,
  wire = false,
  dashed = false,
  label = "",
}: {
  points: readonly Pt[];
  progress: number;
  color: string;
  radius?: number;
  wire?: boolean;
  dashed?: boolean;
  label?: string;
}) {
  const at = along(points, progress);
  const flying = progress > 0 && progress < 1;
  return (
    <g>
      {wire && (
        <path
          className="sf-wire"
          d={polyline(points)}
          strokeDasharray={dashed ? "4 8" : undefined}
        />
      )}
      <g style={{ opacity: flying ? 1 : 0 }}>
        <circle cx={at[0]} cy={at[1]} r={radius} fill={color} />
        {label && (
          <text
            className="sf-mono is-small"
            x={at[0]}
            y={at[1] - radius - 10}
            textAnchor="middle"
            style={{ fill: color }}
          >
            {label}
          </text>
        )}
      </g>
    </g>
  );
}
