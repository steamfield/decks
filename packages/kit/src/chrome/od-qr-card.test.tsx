import { render, screen } from "@testing-library/react";
import { renderSVG } from "uqr";
import { expect, it } from "vitest";
import { OdQrCard } from "../index";

it("renders a QR code encoding the supplied URL with its accessible label", () => {
  const url = "https://example.com/talk";
  const view = render(<OdQrCard url={url} label="the talk" sublabel="Read more" />);
  const code = screen.getByRole("img", { name: "QR code to the talk" });
  // SVG geometry is the observable output of the URL encoder, not a placeholder image.
  const expected = new DOMParser().parseFromString(
    renderSVG(url, { ecc: "M", border: 0 }),
    "image/svg+xml",
  );
  expect(code.querySelector("svg")?.getAttribute("viewBox")).toBe(
    expected.documentElement.getAttribute("viewBox"),
  );
  expect(code.querySelector("path")?.getAttribute("d")).toBe(
    expected.querySelector("path")?.getAttribute("d"),
  );
  expect(screen.getByText("Read more")).toBeVisible();
  const previous = code.querySelector("svg")?.outerHTML;
  view.rerender(<OdQrCard url="https://example.com/other" ariaLabel="Other talk" />);
  expect(screen.getByRole("img", { name: "Other talk" }).querySelector("svg")?.outerHTML).not.toBe(
    previous,
  );
});
