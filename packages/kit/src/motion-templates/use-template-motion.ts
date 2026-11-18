import type { gsap } from "@react-decks/motion";
import { useStageEntrance } from "../story/entrance";

type Build = (tl: gsap.core.Timeline) => void;

/**
 * The motion rule every template shares. The entrance plays on click `at`, or on arrival (after
 * the slide transition) when `at` is 0; each step then plays on the click after the last. Build
 * every tween with `fromTo`, so the timeline can be sought to any click: outside the live slide,
 * in instant mode, after a jump or a reload, the pose for the click shows with no animation.
 *
 * Split text (SplitText) in a `useLayoutEffect` declared before this hook, keep the split in a
 * ref the builds read, and revert it in that effect's cleanup.
 */
export function useTemplateMotion(at: number, entrance: Build, steps: readonly Build[] = []): void {
  useStageEntrance(
    (tl) => {
      if (at === 0) entrance(tl);
    },
    {
      beats: (tl, beat) => {
        beat(0);
        for (let click = 1; click <= at; click++) {
          // Clicks before `at` share time 0, so they all show the hidden pose.
          if (click === at) entrance(tl);
          beat(click);
        }
        steps.forEach((step, index) => {
          step(tl);
          beat(at + index + 1);
        });
      },
    },
  );
}
