import { motionMode } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";
import type { AnimationEvent } from "react";
import { theme } from "../theme/theme";

// animationend bubbles, so one listener on the <svg> sees both layer groups.
function onAnimationEnd(event: AnimationEvent<SVGSVGElement>) {
  if (!event.animationName.includes("move")) return;
  const layer = event.target;
  if (!(layer instanceof Element)) return;
  if (layer.classList.contains("od-settle-teal"))
    layer.classList.replace("od-settle-teal", "od-float-teal");
  else if (layer.classList.contains("od-settle-cyan"))
    layer.classList.replace("od-settle-cyan", "od-float-cyan");
}

/**
 * The theme's brand mark (`brand.logo`; `null` renders nothing). On the live slide its layers
 * play the two-cycle intro and then float; everywhere else, and under instant motion, the mark
 * is drawn settled.
 */
export function OdLogo({ size = 32 }: { size?: number }) {
  const { renderContext } = useSlide();
  const { logo } = theme().brand;
  if (!logo) return null;
  const settled = renderContext !== "slide" || motionMode() === "instant";
  return (
    <svg
      className={settled ? "od-logo is-settled" : "od-logo"}
      width={size}
      height={size}
      viewBox={logo["view-box"]}
      aria-hidden="true"
      onAnimationEnd={onAnimationEnd}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is supplied by the deck author's own theme.json.
      dangerouslySetInnerHTML={{ __html: logo.svg }}
    />
  );
}
