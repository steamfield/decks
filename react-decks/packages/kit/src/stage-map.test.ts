import { expect, it } from "vitest";
import { STAGE, useStageMap } from "./index";

it("maps the stage corners onto the frame corners", () => {
  expect(useStageMap().toPctBox(0, 0, STAGE.width, STAGE.height)).toEqual({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });
});

it("round trips a box", () => {
  const { toPctBox, toStageCenter, toStageSize } = useStageMap();
  const box = { left: 21, top: 45, width: 30, height: 13 };
  const { x, y } = toStageCenter(box);
  const { width, height } = toStageSize(box);
  const back = toPctBox(x - width / 2, y - height / 2, width, height);
  for (const k of ["left", "top", "width", "height"] as const)
    expect(back[k]).toBeCloseTo(box[k], 10);
});

it("puts the stage centre at the middle of the frame", () => {
  expect(useStageMap().toStageCenter({ left: 0, top: 0, width: 100, height: 100 })).toEqual({
    x: 960,
    y: 540,
  });
});

it("keeps the same mapping when the window is resized", () => {
  const { toPctBox } = useStageMap();
  const before = toPctBox(192, 108, 960, 540);
  const width = Object.getOwnPropertyDescriptor(window, "innerWidth");
  const height = Object.getOwnPropertyDescriptor(window, "innerHeight");
  try {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    window.dispatchEvent(new Event("resize"));
    expect(toPctBox(192, 108, 960, 540)).toEqual(before);
  } finally {
    if (width) Object.defineProperty(window, "innerWidth", width);
    if (height) Object.defineProperty(window, "innerHeight", height);
  }
});
