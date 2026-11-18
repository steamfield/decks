import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "team-grid",
  people: [
    { name: "Ada Reed", role: "Design lead" },
    { name: "Li Wu", role: "Field engineer" },
  ],
} as const;
const parts = () => screen.getAllByRole("listitem", { hidden: true });
beforeEach(() => installTheme(resolveTheme()));

it("team-grid hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).toBeVisible();
  await view.previous();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
});

it("the team-grid entrance in the live slide plays and settles within about 1.2 s of virtual time", async () => {
  await setup(() => <MotionTemplate {...props} />);
  const [first] = parts();
  if (!first) throw new Error("Missing first part");
  expect(first).not.toBeVisible();
  await tick(0.06);
  const opacity = Number(getComputedStyle(first).opacity);
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  expect(parts()[1]).not.toBeVisible();
  await tick(1.14);
  for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
});

it("team-grid shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
});

it.each([
  [{ at: -1 }, "team-grid: invalid at -1"],
  [{ at: 0.5 }, "team-grid: invalid at 0.5"],
  [
    { people: [{ name: " ", role: "Lead" }, props.people[1]] },
    'team-grid: invalid people[0].name " "',
  ],
  [{ people: [props.people[0], { name: "Li", role: "" }] }, 'team-grid: invalid people[1].role ""'],
] as const)(
  "team-grid throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it("team-grid shows initials when src is absent", async () => {
  await setup(() => <MotionTemplate {...props} />, { instant: true });
  for (const initials of ["AR", "LW"]) {
    const avatar = screen.getByText(initials);
    expect(avatar).toBeVisible();
    expect(avatar).toHaveAttribute("aria-hidden", "true");
  }
  expect(screen.getByText("Field engineer")).toBeVisible();
});

it.each([0, 1, 7])(
  "team-grid throws for fewer than 2 or more than 6 people (%i)",
  async (count) => {
    const people = Array.from({ length: count }, () => props.people[0]);
    const { errors } = await setup(() => <MotionTemplate {...props} people={people} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(`team-grid: invalid people ${JSON.stringify(people)}`)]);
  },
);

it.each(["name", "role"] as const)(
  "team-grid identifies a missing %s in MDX data",
  async (field) => {
    const person = { ...props.people[0] };
    Reflect.deleteProperty(person, field);
    const { errors } = await setup(
      () => <MotionTemplate {...props} people={[person, props.people[1]]} />,
      { error: true },
    );
    expect(errors).toEqual([new Error(`team-grid: invalid people[0].${field} undefined`)]);
  },
);

it("keeps the first grapheme in initials and accepts an empty portrait URL", async () => {
  await setup(
    () => (
      <MotionTemplate
        {...props}
        people={[{ name: "E\u0301lise Park", role: "Mentor", src: "" }, props.people[1]]}
      />
    ),
    { instant: true },
  );
  expect(screen.getByText("E\u0301P")).toBeVisible();
});
