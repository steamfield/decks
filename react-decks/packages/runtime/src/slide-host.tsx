import { type ReactElement, Suspense, useMemo } from "react";
import { type RenderContext, SlideContext, useDeckContext, useDeckSelector } from "./hooks";

export function SlideHost({
  no,
  context,
  clicks,
}: {
  no: number;
  context: RenderContext;
  clicks?: number;
}): ReactElement {
  const { source, modules } = useDeckContext();
  const meta = source.manifest.slides[no - 1];
  const active = useDeckSelector((state) => context === "slide" && state.nav.slide === no);
  const value = useMemo(() => {
    if (!meta) throw new Error(`Unknown slide ${no}`);
    return { meta, context, clicks };
  }, [meta, context, clicks, no]);
  const module = modules.get(value.meta.id);
  if (!module) throw new Error(`Missing slide module for ${value.meta.id}`);
  const { Component } = module;
  return (
    <div
      data-deck-slide={no}
      data-deck-context={context}
      data-deck-active={active ? "" : undefined}
      hidden={context === "slide" && !active}
    >
      <SlideContext value={value}>
        <Suspense fallback={null}>
          <Component components={source.components} />
        </Suspense>
      </SlideContext>
    </div>
  );
}
