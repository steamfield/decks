// Characterization of the install tabs island: what the server sends (the no-JS page), copy
// tracking and multi-line commands. InstallTabs.test.tsx covers switching and copying.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstallTabs } from "./InstallTabs";

const track = vi.fn();
vi.mock("../../lib/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

const install = [
  { label: "bun", command: "bun add -d slidev-addon-decks\nbunx -p slidev-addon-decks decks init" },
  { label: "npm", command: "npm i -D slidev-addon-decks" },
];

function html(markup: string) {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  return container;
}

beforeEach(() => {
  track.mockClear();
  document.body.innerHTML = "";
});

describe("InstallTabs", () => {
  it("server-renders the tabs and the first command, with no visible copy button", () => {
    const root = html(renderToString(<InstallTabs options={install} />));
    expect(within(root).getByRole("tablist", { name: "Install with" })).toBeInTheDocument();
    expect(
      within(root)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["bun", "npm"]);
    expect(root).toHaveTextContent("bunx -p slidev-addon-decks decks init");
    const visibleButtons = [...root.querySelectorAll("button")].filter(
      (button) => !button.hidden && button.getAttribute("role") !== "tab",
    );
    expect(visibleButtons).toEqual([]);
  });

  it("shows each command without a prompt glyph", () => {
    render(<InstallTabs options={install} />);
    expect(screen.getByRole("tabpanel").textContent).not.toContain("$");
  });

  it("copies a multi-line command whole and tracks it with the tab's label", async () => {
    const user = userEvent.setup();
    render(<InstallTabs options={install} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await navigator.clipboard.readText()).toBe(install[0]?.command);
    expect(track).toHaveBeenCalledWith("install_copied", { method: "bun" });
    await user.click(screen.getByRole("tab", { name: "npm" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await navigator.clipboard.readText()).toBe("npm i -D slidev-addon-decks");
    expect(track).toHaveBeenLastCalledWith("install_copied", { method: "npm" });
  });

  it("resets the copied label when the tab changes", async () => {
    const user = userEvent.setup();
    render(<InstallTabs options={install} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "npm" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
