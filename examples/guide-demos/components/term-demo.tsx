import { useSlide } from "@steamfield/decks";
import { LiveTerm } from "@steamfield/decks/kit";
import styles from "./term-demo.module.css";

const pane = {
  id: "scaffold",
  rows: 18,
  cols: 56,
  cwd: "temp",
  commands: ["decks new talk --story", "ls decks/talk/slides", "decks check"],
};

// Captured from a real run of these commands in an empty project (see docs/guide/terminal.md).
const RECORDING = [
  {
    command: pane.commands[0],
    output: [
      "Wrote decks/talk/components/FirstStage.tsx",
      "Wrote decks/talk/data-sources.md",
      "Wrote decks/talk/data/01-first.ts",
      "Wrote decks/talk/deck.config.ts",
      "Wrote decks/talk/setup.ts",
      "Wrote decks/talk/slides/01-cover.mdx",
      "Wrote decks/talk/slides/02-first-point.mdx",
      "Wrote decks/talk/styles/index.css",
      'Registered "talk" in decks.json.',
      "Next: decks dev talk",
    ],
  },
  { command: pane.commands[1], output: ["01-cover.mdx", "02-first-point.mdx"] },
  { command: pane.commands[2], output: ["All decks check out."] },
];

export function TermDemo() {
  const { clicks } = useSlide();
  return (
    <LiveTerm
      pane={pane}
      click={clicks}
      fallback={
        <pre className={styles.recording}>
          {RECORDING.slice(0, clicks).map(({ command, output }) => (
            <span key={command}>
              <span className={styles.prompt}>$ </span>
              {command}
              {"\n"}
              <span className={styles.output}>{output.join("\n")}</span>
              {"\n"}
            </span>
          ))}
          <span className={styles.prompt}>$ </span>
        </pre>
      }
      frame={(content, status) => (
        <figure className={styles.window}>
          <div className={styles.screen}>{content}</div>
          <figcaption className={styles.status}>
            {status.live ? "Live" : "Recorded"}
            {status.queued ? " · queued" : status.busy ? " · busy" : ""}
          </figcaption>
        </figure>
      )}
    />
  );
}
