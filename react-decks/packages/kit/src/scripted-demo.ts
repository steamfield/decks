import { useSlide } from "@react-decks/runtime";
import { useState } from "react";

export function useScriptedDemo() {
  const { clicks, isActive } = useSlide();
  const [visit, setVisit] = useState({ active: isActive, count: isActive ? 1 : 0 });
  // Track the activation edge during render so children see the new visit together.
  if (visit.active !== isActive)
    setVisit({ active: isActive, count: visit.count + (isActive ? 1 : 0) });
  return { clicks, isActive, playCount: visit.count, shown: (at: number) => clicks >= at };
}
