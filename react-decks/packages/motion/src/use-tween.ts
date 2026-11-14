import { useState, useSyncExternalStore } from "react";

export function useTween<T extends Record<string, number>>(initial: T): T {
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
              for (const notify of listeners) notify();
            };
            pending = publish;
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
          }
        };
      },
    };
  });
  useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  return store.value;
}
