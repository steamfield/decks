import type { DeckManifest } from "./manifest";
import type { NavState } from "./navigation";

export function clicksForSlide(slideNo: number, nav: NavState, manifest: DeckManifest): number {
  const slide = manifest.slides.find((entry) => entry.no === slideNo);
  if (!slide) return 0;
  if (slideNo === nav.slide) return nav.click;
  return slideNo < nav.slide ? slide.clicks : 0;
}

export type StepState = "before" | "current" | "after" | "gone";

export function stepState(clicks: number, at: number, until?: number): StepState {
  if (until !== undefined && until <= at) {
    throw new Error(`Step until ${until} must be greater than at ${at}`);
  }
  if (clicks < at) return "before";
  if (clicks === at) return "current";
  if (until !== undefined && clicks >= until) return "gone";
  return "after";
}
