import { render, screen } from "@testing-library/react";
import type { MDXComponents } from "mdx/types";
import { ErrorBoundary } from "react-error-boundary";
import { expect, it } from "vitest";
import { makeSource, setup } from "../deck.test-support";
import { TwoCol } from "../index";

it.each([0, 1, 3])("TwoCol reports %s element children to the author", (count) => {
  render(
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <p role="alert">{error instanceof Error ? error.message : String(error)}</p>
      )}
    >
      <TwoCol>
        {["First", "Second", "Third"].slice(0, count).map((name) => (
          <p key={name}>{name}</p>
        ))}
      </TwoCol>
    </ErrorBoundary>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(`received ${count}`);
});

it("TwoCol keeps both element children and ignores intervening whitespace", () => {
  render(
    <TwoCol>
      <article>Argument</article>
      {"\n  "}
      <aside>Evidence</aside>
    </TwoCol>,
  );
  expect(screen.getByRole("article")).toHaveTextContent("Argument");
  expect(screen.getByRole("complementary")).toHaveTextContent("Evidence");
});

function LocalCenter() {
  return <h1>The deck chooses its own center.</h1>;
}
function Slide({ components }: { components?: MDXComponents }) {
  const Layout = components?.Center;
  if (typeof Layout !== "function") throw new Error("Missing Center");
  return <Layout />;
}

it("SlideHost passes the deck's layout override to the slide", async () => {
  const base = makeSource();
  setup("#/1", {
    ...base,
    components: { Center: LocalCenter },
    slides: { ...base.slides, "slide-1": async () => ({ default: Slide }) },
  });
  expect(
    await screen.findByRole("heading", { name: "The deck chooses its own center." }),
  ).toBeVisible();
});
