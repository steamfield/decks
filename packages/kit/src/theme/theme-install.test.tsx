import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ink, installTheme, resolveTheme, scaleChartTheme, slideChartTheme, theme } from "../index";

describe("installTheme", () => {
  it("writes the custom properties and replaces them when installed again", () => {
    expect(() => theme()).toThrow("No kit theme installed");
    const initial = document.head.querySelectorAll("style").length;
    const first = resolveTheme({ shape: { radius: "4px" } });
    installTheme(first);
    render(
      <div role="status" style={{ color: "var(--od-cyan)" }}>
        Theme installed
      </div>,
    );
    expect(screen.getByRole("status")).toBeVisible();
    expect(getComputedStyle(document.documentElement).getPropertyValue("--od-radius")).toBe("4px");
    const second = resolveTheme({ ramps: { cyan: ["#112233", "#223344", "#334455", "#445566"] } });
    installTheme(second);
    expect(document.head.querySelectorAll("style")).toHaveLength(initial + 1);
    expect(getComputedStyle(document.documentElement).getPropertyValue("--od-radius")).toBe(resolveTheme().shape.radius);
    expect(getComputedStyle(document.documentElement).getPropertyValue("--od-cyan")).toBe(
      "#223344",
    );
    expect(theme()).toBe(second);
    expect(ink("cyan", 2)).toBe("#223344");
    expect(slideChartTheme.colors.text).toBe(second.chart.text);
    const half = scaleChartTheme(slideChartTheme, 0.5);
    expect(half.fonts.sizes.axisTick).toBe(slideChartTheme.fonts.sizes.axisTick * 0.5);
    expect(half.spacing.xAxisHeight).toBe(slideChartTheme.spacing.xAxisHeight * 0.5);
  });
});
