import { transitionInFlight } from "../transitions/transition";

const probes = new Set<() => boolean>();

export function registerSettleProbe(isBusy: () => boolean): () => void {
  probes.add(isBusy);
  return () => {
    probes.delete(isBusy);
  };
}

/** Reports fonts and registered motion probes that capture tools must still advance. */
export function busy(): string[] {
  const reasons = document.fonts?.status === "loading" ? ["loading fonts"] : [];
  for (const probe of probes) if (probe()) reasons.push(probe.name || "settle probe");
  return reasons;
}

export async function settled(): Promise<void> {
  await document.fonts?.ready;
  return new Promise((resolve) => {
    let quietFrames = 0;
    function frame() {
      const running =
        transitionInFlight() ||
        busy().length > 0 ||
        (document.getAnimations?.() ?? []).some((animation) => {
          const end = animation.effect?.getComputedTiming().endTime;
          return (
            animation.playState === "running" && typeof end === "number" && Number.isFinite(end)
          );
        });
      quietFrames = running ? 0 : quietFrames + 1;
      if (quietFrames === 2) resolve();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

declare global {
  interface Window {
    __deck?: { settled(): Promise<void>; busy(): string[]; preload(slide: number): Promise<void> };
  }
}
