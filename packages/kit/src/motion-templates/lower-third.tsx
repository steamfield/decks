import { duration, ease } from "@react-decks/motion";
import { useRef } from "react";
import { ink } from "../theme/theme";
import styles from "./lower-third.module.css";
import type { TemplateProps } from "./motion-template-props";
import { useTemplateMotion } from "./use-template-motion";

export function LowerThird({ name, role, at = 0, accent = "cyan" }: TemplateProps<"lower-third">) {
  if (!Number.isInteger(at) || at < 0)
    throw new Error(`lower-third at must be a nonnegative integer, got ${at}`);
  if (!name.trim())
    throw new Error(`lower-third name must contain text, got ${JSON.stringify(name)}`);
  if (!role.trim())
    throw new Error(`lower-third role must contain text, got ${JSON.stringify(role)}`);
  const figure = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const nameLine = useRef<HTMLHeadingElement>(null);
  const roleLine = useRef<HTMLParagraphElement>(null);
  const layout = (
    <figure className={styles.figure} ref={figure} style={{ color: ink(accent, 3) }}>
      <div ref={bar} className={styles.bar} aria-hidden="true" />
      <div className={styles.mask}>
        <h2 ref={nameLine}>{name}</h2>
        <p className="od-body" ref={roleLine}>
          {role}
        </p>
      </div>
    </figure>
  );
  useTemplateMotion(at, (tl) => {
    // Beat 1: the block wipes in, the two lines slide out, and the block narrows to a bar.
    tl.fromTo(
      figure.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.quick, ease: ease.enter },
      0,
    );
    tl.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, duration: duration.base, ease: ease.enter },
      0,
    );
    tl.fromTo(
      nameLine.current,
      { xPercent: -100 },
      { xPercent: 0, duration: duration.slow, ease: ease.enter },
      duration.quick,
    );
    tl.fromTo(
      roleLine.current,
      { xPercent: -100 },
      { xPercent: 0, duration: duration.slow, ease: ease.enter },
      duration.base,
    );
    tl.fromTo(
      bar.current,
      { scaleX: 1 },
      { scaleX: 0.08, immediateRender: false, duration: duration.base, ease: ease.enter },
      duration.base,
    );
  });
  return layout;
}
