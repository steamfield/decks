import { transitionInFlight } from "../transitions/transition";

const probes = new Set<{ isBusy: () => boolean; label?: string }>();

/**
 * Holds `settled()` while `isBusy` returns true. `label` names what is busy in `busy()`, so a
 * capture that times out can say what it waited on.
 */
export function registerSettleProbe(isBusy: () => boolean, label?: string): () => void {
  const probe = { isBusy, label };
  probes.add(probe);
  return () => {
    probes.delete(probe);
  };
}

/** Reports fonts and registered motion probes that capture tools must still advance. */
export function busy(): string[] {
  const reasons = document.fonts?.status === "loading" ? ["loading fonts"] : [];
  for (const { isBusy, label } of probes)
    if (isBusy()) reasons.push(label ?? (isBusy.name || "settle probe"));
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
