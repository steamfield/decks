import { act, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { useScriptedDemo } from "../index";
import { setup } from "../kit.test-support";

function Demo() {
  const { clicks, shown, playCount, isActive } = useScriptedDemo();
  return (
    <>
      <output aria-label="Demo">{`${clicks}/${playCount}/${isActive}`}</output>
      {shown(1) && <p>Revealed</p>}
    </>
  );
}
it("reveals by click and counts activation edges rather than renders or clicks", async () => {
  const app = await setup(Demo);
  expect(screen.queryByText("Revealed")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Demo")).toHaveTextContent("0/1/true");
  await app.next();
  expect(screen.getByText("Revealed")).toBeVisible();
  expect(screen.getByLabelText("Demo")).toHaveTextContent("1/1/true");
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  await act(async () => app.store.dispatch({ type: "go", slide: 1 }));
  expect(screen.getByLabelText("Demo")).toHaveTextContent("0/2/true");
});
