import { useEffect } from "react";
import { useDeckSelector } from "../hooks";

export function useDeckAttention() {
  const view = useDeckSelector((state) => state.view);
  useEffect(() => {
    if ((view !== "play" && view !== "presenter") || !navigator.wakeLock) return;
    let requestVersion = 0;
    let lock: WakeLockSentinel | undefined;
    async function request() {
      if (document.visibilityState !== "visible") return;
      const version = ++requestVersion;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (version !== requestVersion || document.visibilityState !== "visible")
          void acquired.release();
        else lock = acquired;
      } catch {
        // Wake lock is optional and can be refused by the browser.
      }
    }
    function visibility() {
      if (document.visibilityState === "visible") void request();
      else {
        requestVersion++;
        void lock?.release();
        lock = undefined;
      }
    }
    void request();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      requestVersion++;
      document.removeEventListener("visibilitychange", visibility);
      void lock?.release();
    };
  }, [view]);
  useEffect(() => {
    if (view !== "play") return;
    const html = document.documentElement;
    let timer: ReturnType<typeof setTimeout>;
    function moved() {
      html.removeAttribute("data-deck-idle");
      clearTimeout(timer);
      timer = setTimeout(() => html.setAttribute("data-deck-idle", ""), 3000);
    }
    moved();
    window.addEventListener("pointermove", moved);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", moved);
      html.removeAttribute("data-deck-idle");
    };
  }, [view]);
}
