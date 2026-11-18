# Motion graphics on clicks

## Give the movement a rhythm

Pick one ease family for the scene. In PathFollow, the marker starts slowly, gathers speed and brakes at the same rate as the stroke beneath it. Both tweens take their timing from one line.

```tsx
const timing = { duration: duration.slow, ease: ease.draw };
```

Overlap parts that describe the same action. The position parameter `"<"` starts the marker when the stroke begins. A positive offset from that position gives the first part a head start. When the two must meet, as they do here, keep the offset at zero.

```tsx
tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "50%", ...timing });
tl.to(marker.current, { motionPath: { path, end: 0.5 }, ...timing }, "<");
beat(1);
```

Hold a readable pose for as long as the speaker needs. At the label above, the marker rests halfway along the route. Place the second leg after the label so the next click releases it. An automatic delay would make the speaker wait even when the audience is ready.

## Stage the type

Keep the words in an HTML heading. KineticType splits its five words under individual masks. SplitText gives the heading the full sentence as its accessible name and hides the pieces from assistive technology.

```tsx
const split = SplitText.create(heading.current, { type: "words", mask: "words", tag: "span" });
```

Give those spans `display: inline-block` so the mask clips the moving word. Return the split's cleanup from the build. It restores the original text when the timeline rebuilds or unmounts, including after the final click.

```tsx
return () => split.revert();
```

Use the stagger token to let adjacent words overlap in time. Five words at this rhythm finish in 0.54 seconds. Beyond about eight items, the audience starts waiting for the tail of the sentence. Shorten the line or reveal a phrase at a time.

```tsx
tl.fromTo(
  split.words,
  { yPercent: 110 },
  {
    yPercent: 0,
    duration: duration.base,
    ease: ease.enter,
    stagger,
  },
);
beat(1);
```

## Move the camera, then let the speaker talk

Fit anticipation, movement and follow-through inside `duration.slow`. SceneOrbit starts at z = 12. The small move away prepares the dolly in. The camera passes its destination by 0.15 units, then eases back to rest. The three parts take 0.58 seconds together.

```tsx
tl.to(camera.position, { z: 12.3, duration: duration.quick, ease: ease.settle });
tl.to(camera.position, { z: 7.85, duration: duration.base, ease: ease.settle });
tl.to(camera.position, { z: 8, duration: duration.quick, ease: ease.settle });
beat(1);
```

Give the speaker a still frame for the explanation. The second click turns the camera's parent through 30 degrees. By the time the speaker points out the side of the cube, the orbit has stopped. The SVG poster shows this final composition in presenter, overview and print.

```tsx
tl.to(pivot.rotation, { y: Math.PI / 6, duration: duration.slow, ease: ease.settle });
beat(2);
```

## Read the contact sheet

Run `decks film <deck> <slide> [click]` with the numbered position of the slide in the deck. It writes a contact sheet in reading order. Film the first click of KineticType and check the distance between successive words as they cross their masks. In PathFollow the dot should stay on the drawing tip. Film the second click of SceneOrbit and check that the cube turns continuously into the angle shown on the poster. Read the final frame at presentation size before moving on.
