import { afterEach, expect, it } from "vitest";
import { setup } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { OdLogo } from "./od-logo";

afterEach(() => installTheme(resolveTheme()));

const mark = {
  brand: {
    logo: {
      "view-box": "0 0 24 24",
      svg: '<g class="od-settle-teal"><rect width="4" height="4"/></g><g class="od-settle-cyan"><rect width="2" height="2"/></g>',
    },
  },
};

it("renders nothing when the theme has no mark", async () => {
  installTheme(resolveTheme({ brand: { logo: null } }));
  const app = await setup(() => (
    <figure aria-label="brand">
      <OdLogo />
    </figure>
  ));
  expect(app.container.querySelector("figure svg")).toBeNull();
});

it("renders the theme's mark at the requested size", async () => {
  installTheme(resolveTheme(mark));
  const app = await setup(() => <OdLogo size={46} />);
  const svg = app.container.querySelector("svg[viewBox='0 0 24 24']");
  expect(svg?.getAttribute("width")).toBe("46");
  expect(svg?.querySelectorAll("rect")).toHaveLength(2);
});
