import {
  createDeckStore,
  Deck,
  type DeckSource,
  type RenderContext,
  useSlide,
} from "@react-decks/runtime";
import { render, screen } from "@testing-library/react";
import { expect, onTestFinished, test } from "vitest";
import { setup } from "../kit.test-support";
import { LiveTerm } from "./live-term";

const pane = { id: "demo", rows: 12, cols: 60, cwd: "temp", commands: ["echo hello", "ls"] };

function Subject() {
  const { clicks } = useSlide();
  return <LiveTerm pane={pane} click={clicks} fallback={<pre>Recorded hello</pre>} />;
}

const contexts: RenderContext[] = ["presenter", "preview", "overview", "print"];

test.each(contexts)("%s context renders the recording", async (context) => {
  await setup(Subject, { context });
  expect(screen.getByText("Recorded hello")).toBeVisible();
  expect(screen.queryByRole("application", { name: "Live terminal" })).not.toBeInTheDocument();
});

test("instant motion renders the recording", async () => {
  await setup(Subject, { instant: true });
  expect(screen.getByText("Recorded hello")).toBeVisible();
});

test("a dev server that never answers attach leaves the recording visible", async () => {
  await setup(Subject);
  expect(screen.getByText("Recorded hello")).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

function Slide() {
  const { no } = useSlide();
  return no === 1 ? <Subject /> : <h1>Second slide</h1>;
}

test.each(["?embedded#/1", "#/2"])("%s keeps the pane on its recording", async (location) => {
  window.history.replaceState(null, "", `/${location}`);
  const slides = [1, 2].map((no) => ({
    no,
    id: `s${no}`,
    file: `${no}.mdx`,
    title: `Slide ${no}`,
    clicks: 2,
  }));
  const source: DeckSource = {
    manifest: {
      name: "terminal",
      title: "Terminal",
      canvas: { width: 1920, height: 1080 },
      slides,
    },
    slides: { s1: async () => ({ default: Slide }), s2: async () => ({ default: Slide }) },
    frontmatter: {},
    components: {},
  };
  const store = createDeckStore(source.manifest);
  const view = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  const recording = await screen.findByText("Recorded hello");
  if (location === "#/2") expect(recording).not.toBeVisible();
  else expect(recording).toBeVisible();
  expect(
    screen.queryByRole("application", { name: "Live terminal", hidden: true }),
  ).not.toBeInTheDocument();
});
