import { type gsap, motionMode, useTimeline } from "@react-decks/motion";
import { registerSettleProbe, useSlide, useSlideScale } from "@react-decks/runtime";
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type * as THREE from "three";

type Setup = (
  scene: { three: typeof THREE; scene: THREE.Scene; camera: THREE.PerspectiveCamera },
  tl: gsap.core.Timeline,
  beat: (n: number) => void,
) => void | (() => void);

function subscribeMotion(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributeFilter: ["data-deck-motion"] });
  return () => observer.disconnect();
}

export function Scene3D({
  setup,
  poster,
  label,
}: {
  setup: Setup;
  poster: ReactNode;
  label: string;
}): ReactNode {
  const { isActive, renderContext, id } = useSlide();
  const host = useRef<HTMLDivElement>(null);
  const resizeFrame = useRef<((scale: number) => void) | null>(null);
  const scale = useSlideScale();
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "instant");
  const [three, setThree] = useState<typeof THREE>();
  const [failed, setFailed] = useState(false);
  const live = isActive && renderContext === "slide" && mode === "live" && !failed;
  const onFailure = useCallback(
    (cause: unknown) => {
      console.warn(`[Scene3D] Slide ${id} could not open its WebGL scene.`, cause);
      setFailed(true);
    },
    [id],
  );
  useLayoutEffect(() => {
    if (!live || three) return;
    let active = true;
    const removeProbe = registerSettleProbe(() => true);
    void import("three").then(
      (module) => {
        if (active) setThree(module);
      },
      (cause) => {
        if (active) onFailure(cause);
      },
    );
    return () => {
      active = false;
      removeProbe();
    };
  }, [live, three, onFailure]);
  useTimeline(
    (tl, beat) => {
      const element = host.current;
      if (!live || !three || !element) {
        beat(0);
        return;
      }
      let renderer: THREE.WebGLRenderer;
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
        if (!context) throw new Error("WebGL 2 is unavailable");
        renderer = new three.WebGLRenderer({ canvas, context, alpha: true });
      } catch (cause) {
        beat(0);
        onFailure(cause);
        return;
      }
      element.append(renderer.domElement);
      const scene = new three.Scene();
      const camera = new three.PerspectiveCamera();
      const render = () => renderer.render(scene, camera);
      const fit = (displayScale: number) => {
        if (!element.clientWidth || !element.clientHeight) return;
        renderer.setPixelRatio(displayScale * window.devicePixelRatio);
        renderer.setSize(element.clientWidth, element.clientHeight);
        camera.aspect = element.clientWidth / element.clientHeight;
        camera.updateProjectionMatrix();
      };
      let cleanup: ReturnType<Setup>;
      const lost = () => onFailure(new Error("WebGL context lost"));
      const release = () => {
        resizeFrame.current = null;
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        try {
          cleanup?.();
        } finally {
          renderer.dispose();
          if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
          renderer.domElement.remove();
        }
      };
      try {
        fit(scale);
        cleanup = setup({ three, scene, camera }, tl, beat);
        const update = tl.eventCallback("onUpdate");
        tl.eventCallback("onUpdate", (...args) => {
          update?.apply(tl.vars.callbackScope ?? tl, args);
          render();
        });
        resizeFrame.current = (displayScale) => {
          fit(displayScale);
          render();
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
      } catch (cause) {
        release();
        throw cause;
      }
      return release;
    },
    // setup describes one activation. An inline callback may change identity on each click.
    [live, three, onFailure],
  );
  useLayoutEffect(() => {
    const element = host.current,
      resize = resizeFrame.current;
    if (!live || !three || !element || !resize) return;
    let density: MediaQueryList | undefined;
    const refresh = () => {
      resize(scale);
      density?.removeEventListener("change", refresh);
      density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      density.addEventListener("change", refresh);
    };
    refresh();
    const observer = new ResizeObserver(refresh);
    observer.observe(element);
    return () => {
      observer.disconnect();
      density?.removeEventListener("change", refresh);
    };
  }, [live, three, scale]);
  return (
    <div ref={host} className="od-scene-3d" role="img" aria-label={label}>
      {live ? null : poster}
    </div>
  );
}
