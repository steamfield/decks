export const FILTER_IDS = {
  marker: "mk-marker",
  markerLite: "mk-marker-lite",
  dry: "mk-dry",
  dryLite: "mk-dry-lite",
  rule: "mk-rule",
  ruleLite: "mk-rule-lite",
  /** Soft same hue glow for clean strokes. Not a marker filter. */
  glow: "mk-glow",
} as const;

export type FilterId = (typeof FILTER_IDS)[keyof typeof FILTER_IDS];

/** `url(#id)` for the filter attribute. */
export function filterUrl(id: string): string {
  const token = Object.entries(FILTER_IDS).find(([, value]) => value === id);
  if (token) return `var(--od-filter-${token[0]})`;
  return `url(#${id})`;
}

interface FilterSpec {
  id: string;
  /** How much grain is bitten out of the alpha channel. Negative. */
  dryness: number;
  /** Displacement amplitude in user units. Zero on the lite variants. */
  displace: number;
  /** Fixed turbulence seed. */
  seed: number;
}

const SPECS: FilterSpec[] = [
  { id: FILTER_IDS.rule, dryness: -0.12, displace: 0.6, seed: 3 },
  { id: FILTER_IDS.ruleLite, dryness: -0.12, displace: 0, seed: 3 },
  { id: FILTER_IDS.marker, dryness: -0.3, displace: 2.6, seed: 7 },
  { id: FILTER_IDS.markerLite, dryness: -0.3, displace: 0, seed: 7 },
  { id: FILTER_IDS.dry, dryness: -0.55, displace: 1.8, seed: 11 },
  { id: FILTER_IDS.dryLite, dryness: -0.55, displace: 0, seed: 11 },
];

export function StoryDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {SPECS.map((spec) => (
        <filter
          key={spec.id}
          id={`${prefix}-${spec.id}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={spec.seed}
            result="grain"
          />
          <feColorMatrix in="grain" type="luminanceToAlpha" result="grainAlpha" />
          <feComposite
            in="SourceGraphic"
            in2="grainAlpha"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={spec.dryness}
            k4={0}
            result="dried"
          />
          {spec.displace !== 0 && (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012"
                numOctaves={2}
                seed={spec.seed + 1}
                result="warp"
              />
              <feDisplacementMap
                in="dried"
                in2="warp"
                scale={spec.displace}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </>
          )}
        </filter>
      ))}
      <filter
        id={`${prefix}-${FILTER_IDS.glow}`}
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="blur" />
        <feComponentTransfer in="blur" result="halo">
          <feFuncA type="linear" slope={0.55} />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="halo" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
