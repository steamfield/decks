import { transitionInFlight } from "./transition";

const probes = new Set<() => boolean>();

export function registerSettleProbe(isBusy: () => boolean): () => void {
  probes.add(isBusy);
  return () => {
    probes.delete(isBusy);
  };
}

export async function settled(): Promise<void> {
  await document.fonts?.ready;
  return new Promise((resolve) => {
    let quietFrames = 0;
    function frame() {
      const busy =
        document.fonts?.status === "loading" ||
        transitionInFlight() ||
        [...probes].some((probe) => probe()) ||
        (document.getAnimations?.() ?? []).some((animation) => {
          const end = animation.effect?.getComputedTiming().endTime;
          return (
            animation.playState === "running" && typeof end === "number" && Number.isFinite(end)
          );
        });
      quietFrames = busy ? 0 : quietFrames + 1;
      if (quietFrames === 2) resolve();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

declare global {
  interface Window {
    __deck?: { settled(): Promise<void> };
  }
}
