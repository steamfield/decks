/**
 * Browser-API stand-ins for `site.test.ts`: an IntersectionObserver the test can drive, a
 * matchMedia that reports reduced motion on cue, and a record of the document listeners the
 * page script adds. Each installer restores what it replaced when the test finishes.
 */
import { onTestFinished, vi } from "vitest";

type Observed = { callback: IntersectionObserverCallback; targets: Set<Element> };

/** An IntersectionObserver whose entries the test delivers by hand through `intersect`. */
export function installIntersectionObserver() {
  const observers: Observed[] = [];
  class FakeObserver {
    readonly entry: Observed;
    constructor(callback: IntersectionObserverCallback) {
      this.entry = { callback, targets: new Set() };
      observers.push(this.entry);
    }
    observe(target: Element) {
      this.entry.targets.add(target);
    }
    unobserve(target: Element) {
      this.entry.targets.delete(target);
    }
    disconnect() {
      this.entry.targets.clear();
    }
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });

  /** Reports `target` as intersecting (or not) to every observer watching it. */
  return function intersect(target: Element, isIntersecting = true) {
    for (const observer of observers) {
      if (!observer.targets.has(target)) continue;
      observer.callback(
        [{ target, isIntersecting } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    }
  };
}

/** Makes `matchMedia` report reduced motion (or no preference) until the test finishes. */
export function installMotionPreference(reduce: boolean) {
  const real = Object.getOwnPropertyDescriptor(window, "matchMedia");
  const fake = (query: string) =>
    ({
      matches: query.includes(": reduce")
        ? reduce
        : query.includes(": no-preference")
          ? !reduce
          : false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: fake });
  onTestFinished(() => {
    if (real) Object.defineProperty(window, "matchMedia", real);
    else Reflect.deleteProperty(window, "matchMedia");
  });
}

/**
 * Removes, when the test finishes, every listener added to `document` from now on. The page
 * script registers its handlers on import and each test imports a fresh copy, so without this
 * the copies from earlier tests would answer the next test's clicks too. Nothing is asserted
 * about the listeners themselves.
 */
export function removeDocumentListenersAfterTest() {
  const added: Parameters<typeof document.addEventListener>[] = [];
  const real = document.addEventListener;
  document.addEventListener = ((...args: Parameters<typeof document.addEventListener>) => {
    added.push(args);
    real.apply(document, args);
  }) as typeof document.addEventListener;
  onTestFinished(() => {
    document.addEventListener = real;
    for (const [type, listener, options] of added) {
      document.removeEventListener(type, listener, options);
    }
  });
}
