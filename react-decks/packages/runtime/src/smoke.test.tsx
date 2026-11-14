import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

// Delete this smoke test when the first real runtime test lands.
it("renders text through React in jsdom", () => {
  render(<p>React decks is ready.</p>);
  expect(screen.getByText("React decks is ready.")).toBeVisible();
});
