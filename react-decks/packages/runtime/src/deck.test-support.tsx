import {
  createMemoryHub,
  createSyncSession,
  type SyncMessage,
  type SyncState,
} from "@react-decks/core";
import { act, render } from "@testing-library/react";
import type { MDXComponents } from "mdx/types";
import { onTestFinished, vi } from "vitest";
import { createDeckStore, Deck, type DeckSource, useDeck, useSlide } from "./index";

export function setup(hash = "#/1", source = makeSource()) {
  window.history.replaceState(null, "", `/${hash}`);
  const store = createDeckStore(source.manifest);
  onTestFinished(() => {
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  return { ...render(<Deck source={source} store={store} />), store, source };
}

export function Status() {
  const deck = useDeck();
  const slide = useSlide();
  return (
    <>
      <h1>{deck.slides[slide.no - 1]?.title}</h1>
      <p
        role="status"
        aria-label={`Deck ${deck.slide}/${deck.total} click ${deck.clicks}/${deck.clicksTotal} view ${deck.view} print ${deck.isPrint}`}
      >{`Deck ${deck.slide}/${deck.total} click ${deck.clicks}/${deck.clicksTotal} view ${deck.view} print ${deck.isPrint}`}</p>
      <p>{`Slide ${slide.no} id ${slide.id} click ${slide.clicks}/${slide.clicksTotal} active ${slide.isActive} context ${slide.renderContext} custom ${slide.frontmatter.custom}`}</p>
      <button type="button" onClick={deck.next}>
        Next click
      </button>
      <button type="button" onClick={deck.prev}>
        Previous click
      </button>
      <button type="button" onClick={deck.nextSlide}>
        Next slide
      </button>
      <button type="button" onClick={deck.prevSlide}>
        Previous slide
      </button>
      <button type="button" onClick={() => deck.go(4, 1)}>
        Go to fourth click one
      </button>
      <button type="button" onClick={() => deck.go(2)}>
        Go to second
      </button>
      <label>
        Input
        <input />
      </label>
      <label>
        Textarea
        <textarea />
      </label>
      <label>
        Select
        <select>
          <option>Option</option>
        </select>
      </label>
      <article contentEditable suppressContentEditableWarning aria-label="Editable">
        Editable text
      </article>
    </>
  );
}

export function Badge({ label }: { label: string }) {
  return <p>{label}</p>;
}

export function AutoFromProps({ components }: { components?: MDXComponents }) {
  const Component = components?.Badge;
  if (typeof Component !== "function") throw new Error("Missing Badge component");
  return <Component label="Automatically provided" />;
}

export function makeSource(): DeckSource {
  const slides = [0, 3, 0, 1, 0].map((clicks, index) => ({
    no: index + 1,
    id: `slide-${index + 1}`,
    file: `slides/${index + 1}.mdx`,
    title: `Title ${index + 1}`,
    clicks,
  }));
  return {
    manifest: { name: "fixture", title: "Fixture", canvas: { width: 1920, height: 1080 }, slides },
    slides: Object.fromEntries(slides.map(({ id }) => [id, async () => ({ default: Status })])),
    frontmatter: Object.fromEntries(slides.map(({ id }) => [id, { custom: id }])),
    components: { Badge },
  };
}

// jsdom has no implementations of these browser APIs.
export function install(target: object, name: string, value: unknown) {
  const previous = Object.getOwnPropertyDescriptor(target, name);
  Object.defineProperty(target, name, { configurable: true, value });
  onTestFinished(() => {
    if (previous) Object.defineProperty(target, name, previous);
    else Reflect.deleteProperty(target, name);
  });
}

export async function deliver(ms = 10) {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
}

export function setupWindowSync(hash = "#/presenter/2?clicks=1") {
  window.history.replaceState(null, "", `/talk/?custom=kept${hash}`);
  const source = makeSource();
  const hub = createMemoryHub();
  const observer = hub.connect();
  const received: SyncMessage[] = [];
  observer.subscribe((message) => received.push(message));
  const store = createDeckStore(source.manifest, { transport: hub.connect() });
  const rendered = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    rendered.unmount();
    store.destroy();
    observer.close();
    window.history.replaceState(null, "", "/");
  });
  function peer(id = "peer", startedAt = 0, initial: SyncState = { nav: { slide: 4, click: 1 } }) {
    let state = initial;
    const applied: SyncState[] = [];
    const session = createSyncSession({
      id,
      startedAt,
      transport: hub.connect(),
      current: () => state,
      onRemote(next) {
        state = next;
        applied.push(next);
      },
    });
    onTestFinished(() => session.close());
    return {
      applied,
      publish(next: SyncState) {
        state = next;
        session.publish(next);
      },
      close: session.close,
    };
  }
  return { store, received, hub, peer };
}
