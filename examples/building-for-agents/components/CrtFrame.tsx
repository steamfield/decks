import { type ReactNode, useId } from "react";
import { CRT } from "./design";

export function CrtFrame({
  x,
  y,
  width,
  height,
  fig = "",
  tag = "",
  progress = 1,
  power = 1,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fig?: string;
  tag?: string;
  progress?: number;
  power?: number;
  children?: ReactNode;
}) {
  const id = useId();
  const screen = {
    x: x + CRT.pad,
    y: y + CRT.pad,
    width: width - CRT.pad * 2,
    height: height - CRT.pad - CRT.tagBand,
  };
  const tagY = y + height - CRT.tagBand / 2 + 5;
  return (
    <g className="sf-crt" style={{ opacity: progress }}>
      <defs>
        <pattern
          id={`${id}-scan`}
          width={CRT.scanPeriod}
          height={CRT.scanPeriod}
          patternUnits="userSpaceOnUse"
        >
          <rect className="sf-crt-scanline" width={CRT.scanPeriod} height={CRT.scanHeight} />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect className="sf-crt-screen" {...screen} />
        </clipPath>
      </defs>
      <rect className="sf-crt-bezel" x={x} y={y} width={width} height={height} />
      <rect className="sf-crt-screen" {...screen} />
      <g clipPath={`url(#${id}-clip)`}>
        <g style={{ opacity: power }}>{children}</g>
        <rect {...screen} fill={`url(#${id}-scan)`} />
      </g>
      <text className="sf-pixel is-small is-fig" x={screen.x + 6} y={tagY}>
        {fig}
      </text>
      <text
        className="sf-pixel is-small"
        x={screen.x + screen.width - 6}
        y={tagY}
        textAnchor="end"
        style={{ opacity: power }}
      >
        {tag}
      </text>
    </g>
  );
}
