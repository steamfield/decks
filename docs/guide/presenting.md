# Presenting

Open the deck's URL, press `f` for fullscreen and use the arrow keys. Press `p` for a presenter window with notes, `o` for an overview of every slide, and `g` to jump to a slide by number or title. Everything the keys do is also on the control tray in the bottom-left corner.

## Keyboard

Navigation, in the play view and the presenter window:

| Key | Action |
| --- | --- |
| `ArrowRight`, `Space`, `PageDown` | Next click, or the next slide after the last click. |
| `ArrowLeft`, `Shift+Space`, `PageUp` | Previous click, or the previous slide at its last click. |
| `ArrowDown` | Next slide, at click 0. |
| `ArrowUp` | Previous slide, at click 0. |
| `Home` | First slide. |
| `End` | Last slide. |

Views and display:

| Key | Action | Where |
| --- | --- | --- |
| `f` | Toggle fullscreen. | Every view, when the browser allows fullscreen. |
| `o` | Open the overview, or close it. | Every view. |
| `Escape` | Close the overview without moving. | The overview. |
| `p` | Open the presenter window. | The play view, when not embedded. |
| `g` | Open the go-to dialog. | The play view and presenter window, when not embedded or in the site player. |
| `Cmd/Ctrl` + `+` or `=` | Larger slide text. | Play view and presenter window. |
| `Cmd/Ctrl` + `-` | Smaller slide text. | Play view and presenter window. |
| `Cmd/Ctrl` + `0` | Slide text back to its authored size. | Play view and presenter window. |

In the overview the arrow keys move between tiles instead: `ArrowRight` and `ArrowDown` to the next tile, `ArrowLeft` and `ArrowUp` to the previous, `Home` and `End` to the first and last.

Keys are ignored while typing in an input, textarea, select or editable element, and a held key acts once. `Space` and `Enter` on a focused button do the button's job, so after clicking "Reset timer" the arrow keys still advance the talk.

## Control tray

Move the pointer to the bottom-left corner of the play view and a row of controls appears: previous, next, the position ("3 / 12", which opens the go-to dialog), overview, presenter, fullscreen and smaller or larger text. It fades out again when the pointer leaves, and `Tab` reaches it from the keyboard. Previous and next are disabled at the first and last click of the deck, and the fullscreen button is absent where the browser does not allow fullscreen.

Moving the pointer away also releases a clicked tray button's focus, so `Space` advances the talk again rather than pressing the button. The tray is not shown in the presenter window, the overview, print, or a deck running `?embedded`.

During a slide transition the browser routes clicks to the transition's snapshot, so a tray click in that moment is dropped. Keys still work; wait for the transition to finish or use the keyboard.

## Go to a slide

Press `g`, or click the position in the tray. Type a number to pick that slide, or any other text to filter slides by title; `ArrowUp` and `ArrowDown` move the selection and `Enter` goes there, at click 0. `Escape` or a click outside closes the dialog without moving. A search that is only digits always means a slide number, so a title such as "2026" is found by another word in it.

In a synced talk, going to a slide from the presenter window moves the audience window too, as any other navigation does.

## The URL

The position is in the URL hash, so a reload, a bookmark or a shared link lands on the same state.

| URL hash | Shows |
| --- | --- |
| `#/5` | Slide 5, click 0. |
| `#/5?clicks=2` | Slide 5, click 2. |
| `#/presenter/5?clicks=2` | The presenter view at that position. |
| `#/overview/5` | The overview, with the talk at slide 5. |

A slide change adds a browser history entry and a click does not, so the browser's Back button steps back one slide. A number past the end of the deck is clamped.

Two search parameters change behaviour: `?motion=instant` turns animation off (see [motion.md](motion.md)), and `?embedded` marks the deck as running inside another page, which turns off the presenter key and window sync.

## Presenter window

Press `p` in the play view. A separate window opens at the current position; drag it to your own screen and leave the first window on the projector. Pressing `p` again focuses the existing presenter window. If the browser blocks the popup, nothing happens: allow popups for the page and press `p` again.

The presenter window shows:

- the current slide, at the current click;
- the next state: what the next key press leads to, or "End of deck" on the last one;
- the speaker notes for the slide, with the segment for the current click marked and scrolled into view (write them with `<Notes>` and `[click]` markers, see [slides.md](slides.md));
- a status bar with the position ("5 / 12"), the click ("click 2 of 3") when the slide has clicks, the local time, and a timer.

The timer starts at the first navigation and counts up. "Reset timer" stops it at `00:00` until the next navigation. Opening the overview does not reset it; a reload does.

Both slide boxes take the shape of the audience window, so you see the framing the room sees. Nothing animates in the presenter window: each click shows its finished state.

## Two-window sync

Every window of the same deck in the same browser follows the others. Navigate in the presenter window and the audience window moves, and the other way around. A window opened or reloaded mid-talk joins at the talk's position.

- Sync runs over the browser's `BroadcastChannel`, so the windows must be in the same browser profile on the same machine, on the same origin. There is no remote control from another device.
- Windows are matched by deck name and URL path. Two different decks served from one origin do not drive each other. `/dir/` and `/dir/index.html` count as the same deck.
- Remote slide changes are added to each window's history, so Back in any window steps the whole room back one slide.
- An embedded deck (`?embedded`) does not sync.

## Overview

Press `o`. The overview is a grid with one tile per visible slide, each drawn at its last click and labelled with its number and title. The current slide's tile is focused.

- Move with the arrow keys or Tab, and press `Enter` or click a tile to go to that slide at click 0.
- Activating the current slide's tile, or pressing `Escape` or `o`, returns without moving, clicks included.
- Browsing the overview does not move the audience. Only choosing a tile does.
- The overview returns to the view it was opened from: the presenter window goes back to the presenter view.

## Fullscreen and the screen

`f` toggles browser fullscreen for the window it is pressed in. The slide always fills its window with no letterbox, so on a screen that is not 16:9 the canvas grows on one side; [canvas.md](canvas.md) covers what slides do with it.

While the play view or presenter window is visible the deck asks the browser to keep the screen awake, where the browser supports it. In the play view the mouse cursor hides after three seconds without movement.

## Text sizing

`Cmd` or `Ctrl` with `+`, `-` and `0` resize slide text. The browser's own zoom is replaced on these keys, because zooming a canvas that is scaled to fit would not make its text any larger.

- Each press multiplies or divides the size by 1.1, within 0.5 to 2.5 times the authored size. `0` restores the authored size.
- The size is remembered per deck in the browser's local storage. Every open window of the deck follows, and it survives a reload. Where storage is blocked, the change applies to the current window only.
- Only text grows; boxes do not. A densely composed slide can overflow after a step or two.
- It affects text whose CSS follows the rule in [canvas.md](canvas.md): `font-size: calc(<size> * var(--deck-text-scale, 1))`. Text sized any other way stays as it is.

## The "Created with Decks" credit

Every slide shows a small "Created with Decks" credit at the lower right, linking to the Decks site, in the slide's own text color. It appears in every view. To remove it, set `credit: false` in `deck.config.ts`; to replace it, add `layers/credit.tsx`. See [config.md](config.md).
