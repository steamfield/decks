import {
  compileGraph,
  Graph,
  type GraphHandle,
  type GraphProps,
  type GraphSpec,
} from "@opendata-ai/openchart-react";
import "@opendata-ai/openchart-react/styles.css";
import { motionMode } from "@react-decks/motion";
import { useSlide, useSlideScale } from "@react-decks/runtime";
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { hashSigned } from "../geometry/hash";
import { CATEGORICAL_COLORS, theme } from "../theme/theme";

const MAX_NODES = 2000;
const ORBIT_SECONDS = 90;
const SETTLE_DRIFT = 0.01;
const SETTLE_QUIET_MS = 600;
const MIN_SETTLE_MS = 1600;
const RESUME_IDLE_MS = 4000;
const MAX_HANDLE_WAIT_MS = 12000;

function subscribeMotion(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-deck-motion"],
  });
  return () => observer.disconnect();
}

export function Graph3D({
  nodes,
  edges,
  orbit = true,
  dim = 1,
  zoom = 1,
  spec,
  legend = false,
}: {
  nodes: { id: string; label?: string; category?: string }[];
  edges: { source: string; target: string; confidence?: number }[];
  orbit?: boolean;
  dim?: number;
  zoom?: number;
  spec?: Record<string, unknown>;
  legend?: GraphProps["legend"];
}) {
  const { isActive, renderContext } = useSlide();
  const scale = useSlideScale();
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "instant");
  const live = isActive && renderContext === "slide" && mode === "live";
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  useLayoutEffect(() => {
    if (!live || ready) return;
    let cancelled = false;
    // Registration must land before Graph mounts; there is never a 2D canvas fallback.
    void import("@opendata-ai/openchart-react/graph-3d").then(
      () => {
        if (!cancelled) setReady(true);
      },
      (cause: unknown) => {
        if (!cancelled) setFailure(new Error("Graph3D WebGL renderer failed to load", { cause }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [live, ready]);
  const graphSpec = useMemo(() => {
    const value: GraphSpec = {
      type: "graph",
      nodes,
      edges,
      animation: { enter: false },
      encoding: {
        ...(nodes.some((node) => node.category !== undefined)
          ? { nodeColor: { field: "category", type: "nominal" } }
          : {}),
        ...(edges.some((edge) => edge.confidence !== undefined)
          ? { edgeWidth: { field: "confidence", type: "quantitative" } }
          : {}),
        ...(nodes.some((node) => node.label !== undefined)
          ? { nodeLabel: { field: "label" } }
          : {}),
      },
      layout: {
        type: "force",
        ...(nodes.some((node) => node.category !== undefined)
          ? { clustering: { field: "category" } }
          : {}),
        chargeStrength: -500,
        linkDistance: 100,
        linkStrength: 0.3,
        collisionPadding: 4,
        warmup: 30,
        seed: 42,
      },
      theme: {
        colors: {
          categorical: CATEGORICAL_COLORS,
          background: "transparent",
          text: theme().chart["graph-label"],
        },
        spacing: { padding: 4 },
      },
      ...spec,
      dimensions: 3,
    };
    if (value.nodes.length > MAX_NODES) {
      console.warn(
        `[Graph3D] ${value.nodes.length} nodes exceeds the ${MAX_NODES} WebGL ceiling; truncating.`,
      );
      value.nodes = value.nodes.slice(0, MAX_NODES);
      const kept = new Set(value.nodes.map((node) => node.id));
      value.edges = value.edges.filter((edge) => kept.has(edge.source) && kept.has(edge.target));
    }
    return value;
  }, [nodes, edges, spec]);
  if (failure) throw failure;
  return (
    <div className="od-graph3d-host" style={{ opacity: dim }}>
      {live && ready && isActive && renderContext === "slide" ? (
        <LiveGraph spec={graphSpec} orbit={orbit} zoom={zoom} legend={legend} scale={scale} />
      ) : (
        <GraphStill spec={graphSpec} zoom={zoom} legend={legend} />
      )}
    </div>
  );
}

/** A deterministic perspective projection, usable even before any live graph has mounted. */
function GraphStill({
  spec,
  zoom,
  legend,
}: {
  spec: GraphSpec;
  zoom: number;
  legend: GraphProps["legend"];
}) {
  const graph = useMemo(
    () => compileGraph(spec, { width: 1920, height: 1080, darkMode: true }),
    [spec],
  );
  // The live renderer opens looking down +z at the origin. Keep that pose in static views.
  const projected = graph.nodes.map((node) => {
    const seed = `${graph.simulationConfig.seed ?? 0}:${node.community ?? ""}`;
    const x = hashSigned(seed, 0, 400) + hashSigned(node.id, 0, 180);
    const y = hashSigned(seed, 1, 240) + hashSigned(node.id, 1, 140);
    const z = hashSigned(node.id, 2, 180);
    const k = (1000 / (1000 - z)) * Math.max(zoom, 1);
    return { ...node, x: 960 + x * k, y: 540 - y * k, r: node.radius * k };
  });
  const positions = new Map(projected.map((node) => [node.id, node]));
  const drawnEdges = graph.edges.map((edge, i) => ({ ...edge, id: `edge${i}` }));
  return (
    <>
      <svg
        className="od-graph3d-still"
        viewBox="0 0 1920 1080"
        role="img"
        aria-label="Similarity graph"
      >
        {drawnEdges.map((edge) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          return (
            <path
              key={edge.id}
              d={`M${source.x} ${source.y}L${target.x} ${target.y}`}
              fill="none"
              stroke={edge.stroke}
              strokeWidth={edge.strokeWidth}
              strokeOpacity={0.3}
            />
          );
        })}
        {projected.map((node, i) => (
          <g key={node.id} aria-label={node.label ?? node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.fill}
              style={{ opacity: node.opacity }}
            />
            {i < 40 && node.label && (
              <text x={node.x + node.r + 5} y={node.y} fill={graph.theme.colors.text}>
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {legend && "entries" in graph.legend && (
        <ul className="od-graph3d-legend" aria-label="Graph categories">
          {graph.legend.entries.map((entry) => (
            <li key={entry.label} style={{ color: entry.color }}>
              {entry.label}
              {(legend === true || legend.counts !== false) && ` (${entry.count ?? 0})`}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LiveGraph({
  spec,
  orbit,
  zoom,
  legend,
  scale,
}: {
  spec: GraphSpec;
  orbit: boolean;
  zoom: number;
  legend: GraphProps["legend"];
  scale: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<GraphHandle>(null);
  const settings = useRef({ orbit, zoom });
  useLayoutEffect(() => {
    settings.current = { orbit, zoom };
  }, [orbit, zoom]);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const mountedAt = performance.now();
    let lastFrame = mountedAt;
    let rafId = 0;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    let paused = false;
    let settled = false;
    let radius = 0;
    let height = 0;
    let angle = 0;
    let fitRadius = 0;
    let fitHeight = 0;
    let center = { x: 0, y: 0, z: 0 };
    let driftAnchor: { distance: number; at: number } | null = null;
    function readPose() {
      const camera = graph.current?.getCamera();
      const position = camera?.position;
      const target = camera?.target;
      if (!position || !target) return false;
      radius = Math.hypot(position.x - target.x, position.z - target.z);
      if (radius === 0) return false;
      height = position.y - target.y;
      angle = Math.atan2(position.z - target.z, position.x - target.x);
      center = { ...target };
      return true;
    }
    function tick(now: number) {
      const handle = graph.current;
      if (!handle && now - mountedAt > MAX_HANDLE_WAIT_MS) {
        console.warn(`Graph3D: no camera handle after ${MAX_HANDLE_WAIT_MS}ms; stopping orbit.`);
        return;
      }
      rafId = requestAnimationFrame(tick);
      const dt = (now - lastFrame) / 1000;
      lastFrame = now;
      if (!handle || paused) return;
      if (!settled) {
        const first = fitRadius === 0;
        const keepAngle = angle;
        handle.zoomToFit({ duration: 0 });
        if (!readPose()) return;
        if (!first) angle = keepAngle;
        fitRadius = radius;
        fitHeight = height;
        const distance = Math.hypot(radius, height);
        if (
          !driftAnchor ||
          Math.abs(distance - driftAnchor.distance) > SETTLE_DRIFT * driftAnchor.distance
        )
          driftAnchor = { distance, at: now };
        else if (now - driftAnchor.at > SETTLE_QUIET_MS && now - mountedAt > MIN_SETTLE_MS)
          settled = true;
      }
      if (fitRadius === 0) return;
      if (settings.current.orbit) angle += ((Math.PI * 2) / ORBIT_SECONDS) * dt;
      radius = fitRadius / Math.max(settings.current.zoom, 1);
      height = fitHeight / Math.max(settings.current.zoom, 1);
      handle.flyTo(
        {
          x: center.x,
          y: center.y,
          position: {
            x: center.x + radius * Math.cos(angle),
            y: center.y + height,
            z: center.z + radius * Math.sin(angle),
          },
          target: center,
        },
        { duration: 0 },
      );
    }
    function onCameraInput() {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!readPose()) return;
        fitRadius = radius * Math.max(settings.current.zoom, 1);
        fitHeight = height * Math.max(settings.current.zoom, 1);
        settled = true;
        paused = false;
      }, RESUME_IDLE_MS);
    }
    element.addEventListener("pointerdown", onCameraInput, true);
    element.addEventListener("wheel", onCameraInput, { capture: true, passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resumeTimer);
      element.removeEventListener("pointerdown", onCameraInput, true);
      element.removeEventListener("wheel", onCameraInput, true);
    };
  }, []);
  return (
    <div
      ref={host}
      className="od-graph3d"
      style={{
        width: `${scale * 100}%`,
        height: `${scale * 100}%`,
        transform: `scale(${1 / scale})`,
        transformOrigin: "top left",
      }}
    >
      <Graph
        ref={graph}
        spec={spec}
        darkMode="force"
        legend={legend}
        tooltip={false}
        fitOnLoad={false}
      />
    </div>
  );
}
