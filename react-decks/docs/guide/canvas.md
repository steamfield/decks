# The canvas

Design every slide for a 1920x1080 canvas and write sizes in pixels of that canvas. The framework scales the canvas to the window, so `font-size: 40px` means 40 of 1080 vertical units on any screen.

## How the canvas fits the window

The canvas never letterboxes. It is scaled so the 1920x1080 design area fits, and the side with room to spare grows to fill the window.

```
scale  = min(windowWidth / 1920, windowHeight / 1080)
width  = windowWidth / scale
height = windowHeight / scale
```

| Window | Scale | Canvas size in design pixels |
| --- | --- | --- |
| 1920 x 1080 | 1 | 1920 x 1080 |
| 960 x 540 | 0.5 | 1920 x 1080 |
| 1600 x 1200 (4:3) | 0.833 | 1920 x 1440 |
| 2560 x 1080 (21:9) | 1 | 2560 x 1080 |

One dimension always equals its design value and the other is equal or larger. A slide therefore gets at least 1920x1080, and on a 4:3 projector it gets 360 extra pixels of height to use or leave empty.

The same rule applies to every frame a slide is drawn in: the play view, the presenter's two boxes and each overview tile. The presenter's boxes take the audience window's aspect ratio, so the speaker sees the framing the room sees.

To design for a different size, set `canvas` in `deck.config.ts` (see [config.md](config.md)).

## CSS variables on the frame

The scaled element (the frame) sets four unitless numbers that slide CSS can read.

| Variable | Value |
| --- | --- |
| `--deck-w` | Canvas width in design pixels (1920 or more). |
| `--deck-h` | Canvas height in design pixels (1080 or more). |
| `--deck-scale` | The scale factor applied to the canvas. |
| `--deck-text-scale` | The viewer's text size multiplier, 1 by default. |

They are numbers, so add a unit with `calc`:

```css
.full-bleed {
  width: calc(var(--deck-w) * 1px);
  height: calc(var(--deck-h) * 1px);
}

/* One screen pixel wide at any window size. */
.hairline {
  border-top: calc(1px / var(--deck-scale)) solid currentColor;
}
```

The frame is also a CSS size container, so `cqw` and `cqh` are 1% of the canvas width and height. Use them where a slide would otherwise use `vw` and `vh`, which measure the window and not the canvas.

The main frame of a view has the id `deck-frame`.

Each slide also carries `--deck-credit-space`: the height of the band along the bottom edge that the "Created with Decks" credit sits in, or `0px` when the credit is off. The built-in layouts keep their content above it. A slide that positions things against the bottom edge can read it:

```css
.footer-note {
  position: absolute;
  bottom: calc(24px + var(--deck-credit-space, 0px));
}
```

## `useSlideScale()`

`useSlideScale()` from `@react-decks/runtime` returns the same scale factor in JavaScript. It returns 1 outside a frame.

You need it only when code measures or draws in screen pixels: `getBoundingClientRect()` returns screen pixels, and a canvas or chart library that sizes itself from its container sees the scaled size. Divide a measurement by the scale to get design pixels.

```tsx
import { useSlideScale } from "@react-decks/runtime";

export function Measured() {
  const scale = useSlideScale();
  // rect.width / scale is the width in design pixels
}
```

Ordinary CSS inside a slide needs no scale: it is written in design pixels and scaled with everything else. `examples/building-for-agents/layers/above.tsx` and the kit's `OpenChart` are the two places in the examples that use it.

## Laying out for screens that are not 16:9

A slide fills its frame: the framework positions each slide root with `inset: 0`. What the slide does with a canvas larger than 1920x1080 is up to its layout.

- Lay out with flex or grid and let the layout take the extra space. A centered block stays centered at 4:3 and 21:9; a two-column grid gets wider columns.
- Size full-slide elements with `width: 100%; height: 100%` or `inset: 0`, not `1920px` by `1080px`. A fixed-size background leaves a strip uncovered on a taller or wider canvas.
- Anchor to edges with `position: absolute` plus `left`, `right`, `top` or `bottom`. An element at `left: 1700px` is not near the right edge on a 21:9 screen; `right: 120px` is.
- The built-in layouts (`Center`, `Cover`, `Section`, `TwoCol`, `ImageSide`) already behave this way.
- A scene that only makes sense at 16:9 (an SVG drawn in fixed coordinates) should sit in a centered 16:9 box inside the slide. The kit's `StoryStage` does that; see [kit.md](kit.md).

The two fixed-layout examples set their slide padding on the slide root, from `examples/basic/styles/index.css`:

```css
[data-deck-slide] {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 96px 120px;
  font-size: calc(40px * var(--deck-text-scale, 1));
}
```

To check a layout, resize the browser window to a 4:3 and a 21:9 shape and look at each slide.

## Font sizes and text scaling

Write every `font-size` in slide CSS like this:

```css
h1 {
  font-size: calc(96px * var(--deck-text-scale, 1));
}
```

The canvas is scaled to fit, so the browser's own zoom would not make slide text larger. The framework binds Cmd/Ctrl with `+`, `-` and `0` instead: each press multiplies or divides `--deck-text-scale` by 1.1, between 0.5 and 2.5, and `0` restores 1. The value reaches a slide only through CSS that multiplies by it. A `font-size` written as a bare `40px` ignores the keys.

The rule covers every unit, not just `px`:

```css
.caption {
  font-size: calc(1.2cqw * var(--deck-text-scale, 1));
}
```

For an inline style or an SVG attribute, put the size in a class so it can use `calc`, or use an inline `style={{ fontSize: "calc(24px * var(--deck-text-scale, 1))" }}`.

Things to know:

- Only text grows. Boxes, padding and images keep their size, so a tightly composed slide overflows after a step or two. Flex and grid layouts absorb more than fixed heights do.
- The fallback `, 1` keeps the rule valid where the variable is not set.
- The kit's stylesheet follows the rule throughout. So do the framework's fenced code blocks.
- The chosen size is stored per deck in the browser and applies to every window of that deck. See [presenting.md](presenting.md).
