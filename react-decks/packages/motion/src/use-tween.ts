import { useLayoutEffect, useReducer, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { pendingTweenNotification } from "./settle";

export function useTween<T extends Record<string, number>>(initial: T): T {
  const [, refresh] = useReducer((revision: number) => revision + 1, 0);
  const [store] = useState(() => {
    const listeners = new Set<() => void>();
    const fields = new Set(Object.keys(initial));
    let revision = 0;
    let pending: (() => void) | null = null;
    const value = new Proxy(
      { ...initial },
      {
        set(target, key, next) {
          const changed = Reflect.get(target, key) !== next;
          Reflect.set(target, key, next);
          if (changed && typeof key === "string" && fields.has(key)) {
            revision++;
            if (pending) return true;
            const publish = () => {
              if (pending !== publish) return;
              pending = null;
              pendingTweenNotification(-1);
              for (const notify of [...listeners]) notify();
            };
            pending = publish;
            pendingTweenNotification(1);
            // Batch GSAP's writes within its frame, including layout-effect seeks before paint.
            queueMicrotask(publish);
          }
          return true;
        },
      },
    );
    return {
      value,
      snapshot: () => revision,
      subscribe(notify: () => void) {
        listeners.add(notify);
        return () => {
          listeners.delete(notify);
          if (!listeners.size && pending) {
            pending = null;
            pendingTweenNotification(-1);
          }
        };
      },
    };
  });
  const revision = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  useLayoutEffect(
    () =>
      store.subscribe(() => {
        // Mount-time seeks must commit before paint, before passive subscriptions exist.
        if (store.snapshot() !== revision) flushSync(refresh);
      }),
    [store, revision],
  );
  return store.value;
}
