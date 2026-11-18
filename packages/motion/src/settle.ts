import { registerSettleProbe } from "@react-decks/runtime";
import { gsap } from "gsap";

let pending = 0;

export function pendingTweenNotification(change: 1 | -1) {
  pending += change;
}

registerSettleProbe(() => {
  if (pending) return true;
  return gsap.globalTimeline.getChildren(true, true, false).some((tween) => {
    let unfinished = false;
    for (
      let animation: gsap.core.Animation | null = tween;
      animation;
      animation = animation.parent
    ) {
      if (animation.paused() || animation.repeat() === -1) return false;
      if (animation !== gsap.globalTimeline) unfinished ||= animation.totalProgress() < 1;
    }
    return unfinished;
  });
}, "gsap tween");
