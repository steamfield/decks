/// <reference types="vite/client" />

import { clicksForSlide } from "@react-decks/core";
import { lazy, type ReactElement, Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DeckCredit } from "./deck-credit";
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
  const [componentStack, setComponentStack] = useState<string | null | undefined>();
  const resetClick = useDeckSelector(
    (state) => clicks ?? clicksForSlide(no, state.nav, source.manifest),
  );
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
  const Credit = source.layers?.credit ?? DeckCredit;
  if (!module) throw new Error(`Missing slide module for ${value.meta.id}`);
  const { Component, startedPending, loadState } = useMemo(() => {
    const loaded = module.resolved?.default;
    const loadState = { failed: false };
    return {
      Component:
        loaded ??
        lazy(() =>
          module.load().catch((cause: unknown) => {
            loadState.failed = true;
            throw cause;
          }),
        ),
      startedPending: loaded === undefined,
      loadState,
    };
  }, [module]);
  // The credit arrives with the slide, so a slide still loading stays empty.
  const content = (
    <>
      <Component components={source.components} />
      {Credit && (
        <div data-deck-layer="credit">
          <Credit />
        </div>
      )}
    </>
  );
  return (
    <div
      data-deck-slide={no}
      data-deck-context={context}
      data-deck-active={active ? "" : undefined}
      data-deck-credit={Credit ? "" : undefined}
      hidden={context === "slide" && !active}
    >
      <SlideContext value={value}>
        <ErrorBoundary
          resetKeys={[module, Component, resetClick]}
          onReset={() => setComponentStack(undefined)}
          onError={(_error, info) => setComponentStack(info.componentStack)}
          fallbackRender={({ error }) => (
            <>
              <ReloadFailedSlide />
              <p>
                {!loadState.failed
                  ? `Slide ${value.meta.id} (${value.meta.file}) failed to render: ${error instanceof Error ? error.message : String(error)}`
                  : `Slide ${value.meta.id} failed to load. See the terminal or the error overlay.`}
              </p>
              {import.meta.env.DEV && componentStack && <pre>{componentStack}</pre>}
            </>
          )}
        >
          {Below && (
            <div data-deck-layer="below">
              <Below />
            </div>
          )}
          {startedPending ? <Suspense fallback={null}>{content}</Suspense> : content}
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

function ReloadFailedSlide() {
  useEffect(() => {
    // A failed lazy import or an unmounted render subtree cannot reliably refresh itself.
    const reload = () => window.location.reload();
    import.meta.hot?.on("vite:afterUpdate", reload);
    return () => import.meta.hot?.off("vite:afterUpdate", reload);
  }, []);
  return null;
}
