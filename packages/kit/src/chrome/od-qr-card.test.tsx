import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { OdQrCard } from "../index";

it("renders a QR code encoding the supplied URL with its accessible label", () => {
  const url = "https://example.com/talk";
  const view = render(<OdQrCard url={url} label="the talk" sublabel="Read more" />);
  const code = screen.getByRole("img", { name: "QR code to the talk" });
  // The encoded modules are the observable output; the rerender below shows they follow the URL.
  expect(code.querySelector("path")?.getAttribute("d")).toBeTruthy();
  expect(screen.getByText("Read more")).toBeVisible();
  const previous = code.querySelector("svg")?.outerHTML;
  view.rerender(<OdQrCard url="https://example.com/other" ariaLabel="Other talk" />);
  expect(screen.getByRole("img", { name: "Other talk" }).querySelector("svg")?.outerHTML).not.toBe(
    previous,
  );
});
