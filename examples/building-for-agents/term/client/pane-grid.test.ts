// @vitest-environment jsdom
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import type { LiveDemo } from "../../components/LiveDemoStage";

test.each([
  { rows: 14, cols: 92 },
  { rows: 11, cols: 167 },
])(
  "a pane with $rows rows and $cols columns rejects a grid different from its layout",
  async ({ rows, cols }) => {
    await import("../../setup");
    const { LiveDemoStage } = await import("../../components/LiveDemoStage");
    const demo: LiveDemo = {
      headline: "Commands run in a shell.",
      product: "stacks",
      copy: [],
      panes: [
        {
          pane: { id: "oversize", rows, cols, cwd: "temp", commands: [] },
          label: "SHELL",
          recording: { kind: "lines", lines: [], shownAt: [0], tag: "Recorded" },
        },
      ],
    };
    expect(() => renderToString(createElement(LiveDemoStage, { demo }))).toThrow(
      /Pane "oversize" must use paneGrid\(1\)/,
    );
  },
);
