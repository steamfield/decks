import { expect, it } from "vitest";
import { CustomEase, duration, ease, gsap } from "./index";

// The curves RFC 0010 names for each role, copied from the motion-reel deck.
const curves = [
  [ease.snap, "M0,0 C0.06,0.6 0.12,0.9 0.3,0.97 0.5,1 0.72,1 1,1"],
  [ease.punch, "M0,0 C0.1,0.7 0.18,1.13 0.4,1.06 0.58,0.99 0.8,1 1,1"],
  [ease.leave, "M0,0 C0.3,-0.06 0.62,0.18 1,1"],
  [ease.slam, "0.76,0,0.24,1"],
] as const;

it.each(curves)("a tween on %s reads its curve's value at the midpoint", (name, curve) => {
  const target = { value: 0 };
  const tween = gsap.fromTo(
    target,
    { value: 0 },
    { value: 100, duration: duration.base, ease: name, paused: true },
  );
  tween.seek(duration.base / 2);
  // gsap renders a tweened number to six decimal places.
  expect(target.value).toBeCloseTo(100 * CustomEase.create(`${name}-reference`, curve)(0.5), 5);
  tween.kill();
});
