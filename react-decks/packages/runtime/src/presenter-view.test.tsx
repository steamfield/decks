import { createMemoryHub, createSyncSession } from "@react-decks/core";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished, vi } from "vitest";
import { makeSource } from "./deck.test-support";
import { createDeckStore, Deck, type DeckSource, type NoteHtml, useSlide } from "./index";

function Slide() {
  const slide = useSlide();
  return <p>{`Slide ${slide.no} click ${slide.clicks} in ${slide.renderContext}`}</p>;
}

function presenterSource(): DeckSource {
  const source = makeSource();
  return {
    ...source,
    slides: Object.fromEntries(
      source.manifest.slides.map(({ id }) => [id, async () => ({ default: Slide })]),
    ),
    loadNotes: async () => ({
      "slide-2": [
        { click: 0, html: "<p>Start here.</p>" },
        { click: 1, html: "<p><strong>First point.</strong></p>" },
        { click: 3, html: "<p>Third point.</p>" },
      ],
    }),
  };
}

function setup(source = presenterSource(), hash = "#/presenter/2") {
  window.history.replaceState(null, "", `/${hash}`);
  const hub = createMemoryHub();
  const store = createDeckStore(source.manifest, { transport: hub.connect() });
  const result = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    result.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  return { ...result, store, hub };
}

it("presenter landmarks render the current position and the next click in distinct contexts", async () => {
  setup();
  expect(
    await within(screen.getByRole("region", { name: "Current slide" })).findByText(
      "Slide 2 click 0 in presenter",
    ),
  ).toBeVisible();
  expect(
    await within(screen.getByRole("region", { name: "Next" })).findByText(
      "Slide 2 click 1 in preview",
    ),
  ).toBeVisible();
  expect(screen.getByRole("contentinfo", { name: "Presentation status" })).toHaveTextContent(
    "2 / 5click 0 of 3",
  );
  expect(screen.getByLabelText("Local time")).toHaveTextContent(/^\d{2}:\d{2}$/);
});

it("the next preview crosses a slide boundary and the last frame shows End of deck", async () => {
  const { store } = setup(presenterSource(), "#/presenter/2?clicks=3");
  expect(
    await within(screen.getByRole("region", { name: "Next" })).findByText(
      "Slide 3 click 0 in preview",
    ),
  ).toBeVisible();
  act(() => store.dispatch({ type: "go", slide: 5 }));
  expect(screen.getByRole("region", { name: "Next" })).toHaveTextContent("End of deck");
  expect(screen.getByRole("contentinfo", { name: "Presentation status" })).not.toHaveTextContent(
    "click",
  );
});

it("a failed presenter slide does not leave the current and preview regions stuck on later slides", async () => {
  const source = presenterSource();
  const { store } = setup({
    ...source,
    slides: {
      ...source.slides,
      "slide-2": async () => {
        throw new Error("Unavailable slide");
      },
    },
  });
  expect(
    await within(screen.getByRole("region", { name: "Current slide" })).findByText(
      "Unable to render slide slide-2.",
    ),
  ).toBeVisible();
  expect(
    await within(screen.getByRole("region", { name: "Next" })).findByText(
      "Unable to render slide slide-2.",
    ),
  ).toBeVisible();
  act(() => store.dispatch({ type: "nextSlide" }));
  expect(
    await within(screen.getByRole("region", { name: "Current slide" })).findByText(
      "Slide 3 click 0 in presenter",
    ),
  ).toBeVisible();
  expect(
    await within(screen.getByRole("region", { name: "Next" })).findByText(
      "Slide 4 click 0 in preview",
    ),
  ).toBeVisible();
});

it("notes render compiled HTML in order and highlight the last segment at or before this click", async () => {
  const user = userEvent.setup();
  setup();
  const notes = screen.getByRole("region", { name: "Notes" });
  await within(notes).findByText("First point.");
  expect(notes).toHaveTextContent("Start here.First point.Third point.");
  expect(within(notes).getByText("Start here.").parentElement).toHaveAttribute(
    "aria-current",
    "true",
  );
  await user.keyboard("{ArrowRight}{ArrowRight}");
  expect(within(notes).getByText("First point.").closest("div")).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(within(notes).getByText("Start here.").parentElement).not.toHaveAttribute("aria-current");
  await user.keyboard("{ArrowRight}");
  expect(within(notes).getByText("Third point.").parentElement).toHaveAttribute(
    "aria-current",
    "true",
  );
});

it("notes stay empty until their loader resolves", async () => {
  const source = presenterSource();
  let resolve: ((notes: Readonly<Record<string, readonly NoteHtml[]>>) => void) | undefined;
  const pending = new Promise<Readonly<Record<string, readonly NoteHtml[]>>>((done) => {
    resolve = done;
  });
  setup({ ...source, loadNotes: () => pending });
  expect(screen.getByRole("region", { name: "Notes" })).toBeEmptyDOMElement();
  await act(async () => resolve?.({ "slide-2": [{ click: 0, html: "<p>Loaded notes</p>" }] }));
  expect(
    within(screen.getByRole("region", { name: "Notes" })).getByText("Loaded notes"),
  ).toBeVisible();
});

it.each(["missing loader", "missing slide", "empty array", "empty segments"])(
  "%s shows the no-notes message",
  async (kind) => {
    const source = presenterSource();
    const notes: Readonly<Record<string, readonly NoteHtml[]>> =
      kind === "missing slide"
        ? {}
        : {
            "slide-2":
              kind === "empty array"
                ? []
                : [
                    { click: 0, html: "" },
                    { click: 1, html: " \n" },
                  ],
          };
    setup({ ...source, loadNotes: kind === "missing loader" ? undefined : async () => notes });
    expect(
      await within(screen.getByRole("region", { name: "Notes" })).findByText(
        "No notes for this slide",
      ),
    ).toBeVisible();
  },
);

it("a rejected notes load shows a useful error while navigation keeps working", async () => {
  setup({
    ...presenterSource(),
    loadNotes: async () => {
      throw new Error("Unavailable notes");
    },
  });
  expect(
    await within(screen.getByRole("region", { name: "Notes" })).findByText("Notes failed to load"),
  ).toBeVisible();
  await userEvent.setup().keyboard("{ArrowDown}");
  expect(window.location.hash).toBe("#/presenter/3");
});

it("the timer waits for navigation, survives overview, resets stopped, and formats an hour", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.setSystemTime(new Date(2026, 0, 1, 13, 5));
  const { store, unmount } = setup();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
  act(() => store.dispatch({ type: "next" }));
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:02");
  act(() => store.setView("overview"));
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  act(() => store.setView("presenter"));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:05");
  vi.setTimerTickMode("interval", 1);
  await user.click(screen.getByRole("button", { name: "Reset timer" }));
  vi.setTimerTickMode("manual");
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
  act(() => store.dispatch({ type: "next" }));
  vi.setSystemTime(Date.now() + 3661000);
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent(/^1:01:0[12]$/);
  expect(screen.getByLabelText("Local time")).toHaveTextContent("14:06");
  unmount();
});

it("remote navigation starts the local timer but remote aspect alone does not", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { hub } = setup();
  const remote = createSyncSession({
    id: "audience",
    startedAt: 0,
    transport: hub.connect(),
    current: () => ({ nav: { slide: 2, click: 0 }, aspect: 4 / 3 }),
    onRemote() {},
  });
  onTestFinished(() => remote.close());
  remote.publish({ nav: { slide: 2, click: 0 }, aspect: 4 / 3 });
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
  remote.publish({ nav: { slide: 2, click: 1 }, aspect: 4 / 3 });
  await act(async () => vi.advanceTimersByTimeAsync(2100));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:02");
});
