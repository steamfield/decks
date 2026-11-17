# Live terminal

`LiveTerm` puts a real shell on a slide. Each click on the slide types the next command into it and runs it, so a talk about a command-line tool never leaves the deck. Everywhere a shell can't run (a built deck, `decks export`, the presenter's preview, the overview, a dev server started without `--live-term`), the pane shows a fallback you supply instead, usually a recording of the same commands.

It works on macOS and Linux. The shell is `zsh`, run through Python's standard `pty` module, so both must be on the speaker's machine. On Windows the dev server logs one line and every pane shows its fallback.

## A pane

```tsx
// components/Demo.tsx
import { useSlide } from "@steamfield/decks";
import { LiveTerm } from "@steamfield/decks/kit";

const pane = {
  id: "hello",
  rows: 12,
  cols: 60,
  cwd: "temp",
  commands: ["echo hello", "ls", "git status"],
};

export function Demo() {
  const { clicks } = useSlide();
  return (
    <LiveTerm
      pane={pane}
      click={clicks}
      fallback={<pre>{RECORDING.slice(0, clicks + 1).join("\n")}</pre>}
    />
  );
}
```

The slide sets `clicks:` in its frontmatter to the number of commands. Moving from click n − 1 to n types `commands[n - 1]` and runs it; returning to click 0 restarts the shell.

| `pane` field | Meaning |
| --- | --- |
| `id` | Unique in the deck. One shell runs per id, shared by every window showing it. |
| `rows`, `cols` | The fixed grid. The font is sized to fill the pane with whole-pixel glyphs; the grid never reflows. |
| `cwd` | `"temp"` for a fresh temporary directory, or a key of `term.dirs` in `deck.config.ts`. Any other value is an error naming the pane. |
| `commands` | The commands, one per click. |

Run it live with `decks dev <deck> --live-term`. The pane goes live when it is in the play view, its slide is the current one, the deck is not embedded and motion is not `instant`. It stays on its fallback otherwise.

## Working directories

A pane that should run in a real project names it through the config:

```ts
export default defineDeck({
  title: "Agents",
  term: { dirs: { repo: "../.." } },
});
```

Paths are relative to the deck directory. The browser only ever sends the key (`cwd: "repo"`), never a path. Every command checks that `dirs` is a record of strings. Only `decks dev --live-term` checks that each directory exists, since a deck built on another machine names directories that only exist on the speaker's.

## Styling and status

The kit ships no terminal skin. The pane reads `--deck-term-font`, `--deck-term-font-size`, `--deck-term-foreground` and `--deck-term-background` from CSS. Without `frame`, a pane that fell back after trying to go live shows the reason below its fallback in a `role="status"` element. With `frame`, you draw that yourself:

```tsx
<LiveTerm
  pane={pane}
  click={clicks}
  fallback={recording}
  frame={(content, status) => (
    <figure className={styles.window}>
      {content}
      <figcaption>
        {status.live ? "Live" : "Recorded"}
        {status.queued ? " · queued" : status.busy ? " · busy" : ""}
        {status.reason && ` · ${status.reason}`}
      </figcaption>
    </figure>
  )}
/>
```

`status` is `{ live, busy, queued, reason? }`: the shell is on screen, a command is running, clicks are waiting for a prompt, and why the pane fell back. The fallback stays visible until the shell has drawn its first prompt, so the slide never shows an empty pane.

## While presenting

A click into the pane gives it the keyboard; `Escape` gives the keys back to the deck. Pressing next while a command still runs queues the next command until the prompt returns. Every audience window shows the same shell, and each command runs once whichever window advanced, the presenter included. The presenter's own preview of the slide shows the fallback. Reloading a window reattaches to the running shell and replays its recent output. If the shell exits or its connection drops, the pane goes back to its fallback with the reason.

The dev server only starts shells when it listens on a loopback address, its hot-update socket shares the page's port, and Vite's socket token and Host checks are on. A deck's `vite` config that changes any of these turns the terminal off with a line in the dev log saying why. None of the checks can be turned off: anything that can reach the socket can type into the shell.

## Limits

- A full-screen program (`vim`, `htop`, a TUI) is not supported. A reattach replays the tail of the output, which redraws such a program wrongly.
- Jumping back to a terminal slide at click 0 from far away (the go-to dialog, the overview) replays the old session instead of restarting the shell. Step to click 1 and back to restart it.
- If the dev server restarts while a pane is past click 0, later commands wait until the pane returns to click 0.
- Typing into a focused pane during the short pause before a command's Enter is sent edits that command.
