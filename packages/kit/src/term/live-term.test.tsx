import { useSlide } from "@react-decks/runtime";
import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { setup } from "../kit.test-support";
import type { LiveTermStatus } from "./live-term";
import { LiveTerm } from "./live-term";

const pane = { id: "demo", rows: 12, cols: 60, cwd: "temp", commands: ["echo hello", "ls"] };

function Subject() {
  const { clicks } = useSlide();
  return <LiveTerm pane={pane} click={clicks} fallback={<pre>Recorded hello</pre>} />;
}

test("a dev server that never answers attach leaves the recording visible", async () => {
  await setup(Subject);
  expect(screen.getByText("Recorded hello")).toBeVisible();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("frame receives the recording and its status and wraps the content", async () => {
  const statuses: LiveTermStatus[] = [];
  await setup(() => (
    <LiveTerm
      pane={pane}
      click={0}
      fallback={<pre>Recorded hello</pre>}
      frame={(content, status) => {
        statuses.push(status);
        return <section aria-label="Terminal frame">{content}</section>;
      }}
    />
  ));
  expect(screen.getByRole("region", { name: "Terminal frame" })).toHaveTextContent(
    "Recorded hello",
  );
  expect(statuses.length).toBeGreaterThan(0);
  for (const status of statuses)
    expect(status).toEqual({ live: false, busy: false, queued: false });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
