import { lazy, type ReactElement, Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { type RenderContext, SlideContext, useDeckContext, useDeckSelector } from "./hooks";
import "./layers.css";

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
  const layers = source.frontmatter[value.meta.id]?.layers;
  const Above = layers !== false && layers !== "below" ? source.layers?.above : undefined;
  const Below = layers !== false && layers !== "above" ? source.layers?.below : undefined;
  if (!module) throw new Error(`Missing slide module for ${value.meta.id}`);
  const { Component, startedPending } = useMemo(() => {
    const loaded = module.resolved?.default;
    return { Component: loaded ?? lazy(module.load), startedPending: loaded === undefined };
  }, [module]);
  return (
    <div
      data-deck-slide={no}
      data-deck-context={context}
      data-deck-active={active ? "" : undefined}
      hidden={context === "slide" && !active}
    >
      <SlideContext value={value}>
        <ErrorBoundary fallback={<p>Unable to render slide {value.meta.id}.</p>}>
          {Below && (
            <div data-deck-layer="below">
              <Below />
            </div>
          )}
          {startedPending ? (
            <Suspense fallback={null}>
              <Component components={source.components} />
            </Suspense>
          ) : (
            <Component components={source.components} />
          )}
          {Above && (
            <div
              data-deck-layer="above"
              style={active ? { viewTransitionName: "deck-layer-above" } : undefined}
            >
              <Above />
            </div>
          )}
        </ErrorBoundary>
      </SlideContext>
    </div>
  );
}
