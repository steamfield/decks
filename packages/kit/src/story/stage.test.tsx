import { useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStage } from "../index";
import { setup, tick } from "../kit.test-support";

function Stage() {
  const state = useTween({ enter: 0, beat: 0 });
  const stage = useStage({
    copy: [{ lead: "First" }, { lead: "Second" }, { lead: "Last" }],
    enter: (tl) => {
      tl.to(state, { enter: 1, duration: 1, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { beat: 10, duration: 1, ease: "none" });
      beat(1);
      tl.to(state, { beat: 20, duration: 1, ease: "none" });
      beat(2);
    },
  });
  return (
    <>
      <h2>{stage.copy.lead}</h2>
      <output aria-label="Stage">{`${stage.clicks}/${stage.beats}/${stage.playCount}/${stage.isActive}`}</output>
      <output aria-label="Pose">{`${state.enter}/${state.beat}`}</output>
    </>
  );
}

function Empty() {
  useStage({ copy: [], beats: (_, beat) => beat(0) });
  return null;
}
describe("useStage", () => {
  it("selects clamped copy and derives beats while the real timeline follows clicks in both directions", async () => {
    const app = await setup(Stage);
    await tick(2);
    expect(screen.getByLabelText("Stage")).toHaveTextContent(/^0\/3\/1\/true$/);
    await app.next();
    await tick(2);
    expect(screen.getByRole("heading", { name: "Second" })).toBeVisible();
    expect(screen.getByLabelText("Pose")).toHaveTextContent(/^1\/10$/);
    await app.next();
    await tick(2);
    await app.next();
    expect(screen.getByRole("heading", { name: "Last" })).toBeVisible();
    await app.previous();
    await tick(2);
    await app.previous();
    await tick(2);
    await app.previous();
    await tick(2);
    expect(screen.getByLabelText("Pose")).toHaveTextContent(/^1\/0$/);
    expect(screen.getByLabelText("Stage")).toHaveTextContent(/^0\/3\/1\/true$/);
  });
  it.each(["presenter", "preview", "overview", "print"] as const)(
    "shows the entrance endpoint in %s",
    async (context) => {
      await setup(Stage, { context });
      await tick(0);
      expect(screen.getByLabelText("Pose")).toHaveTextContent(/^1\/0$/);
    },
  );
  it.each([{ instant: true }, { click: 2 }])(
    "settles instead of replaying for %j",
    async (options) => {
      await setup(Stage, options);
      await tick(0);
      expect(screen.getByLabelText("Pose")).toHaveTextContent(new RegExp(`^1/${options.click ? 20 : 0}$`));
    },
  );
  it("holds an inactive entrance at zero and plays once on a new visit", async () => {
    const app = await setup(Stage);
    await tick(2);
    await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
    await screen.findByRole("heading", { name: "Second slide" });
    await tick(0);
    expect(screen.getByLabelText("Pose")).toHaveTextContent(/^0\/20$/);
    await act(async () => app.store.dispatch({ type: "go", slide: 1 }));
    await tick(0);
    expect(screen.getByLabelText("Stage")).toHaveTextContent(/^0\/3\/2\/true$/);
    expect(screen.getByLabelText("Pose")).toHaveTextContent(/^0\/0$/);
    await tick(1);
    expect(screen.getByLabelText("Pose")).toHaveTextContent(/^1\/0$/);
  });
  it("rejects an empty copy array with an author-facing error", async () => {
    const broken = await setup(Empty, { error: true });
    await screen.findByText(/^Slide s1 .*failed to render: .*copy entry/);
    expect(
      broken.errors.some((error) => error instanceof Error && error.message.includes("copy entry")),
    ).toBe(true);
    broken.unmount();
  });
});
