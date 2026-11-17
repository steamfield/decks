import { useSlide } from "@steamfield/decks";
import { LiveTerm } from "@steamfield/decks/kit";
import { useState } from "react";
import styles from "./TerminalDemo.module.css";

const pane = {
  id: "hello",
  rows: 12,
  cols: 60,
  cwd: "temp",
  commands: [
    "echo hello; printf 1 >> executions",
    "ls; printf 2 >> executions; read -r '?Finish ls: '; echo ls-finished",
    "echo third; printf 3 >> executions; echo executions=$(cat executions)",
  ],
};

export function TerminalDemo({ framed = true }: { framed?: boolean }) {
  const { clicks } = useSlide();
  const [narrow, setNarrow] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setNarrow(!narrow)}>
        Resize terminal
      </button>
      <section
        className={`${framed ? styles.demo : styles.plain} ${narrow ? styles.narrow : ""}`}
        aria-label={framed ? "Framed terminal" : "Plain terminal"}
      >
        <LiveTerm
          pane={framed ? pane : { ...pane, id: "plain", cols: 61 }}
          click={clicks}
          fallback={
            <section aria-label={framed ? "Terminal recording" : "Plain terminal recording"}>
              <pre>{`$ ${clicks >= 1 ? "echo hello\nhello\n$ " : ""}${clicks >= 2 ? "ls\n$ " : ""}${clicks >= 3 ? "echo third\nthird\n$ " : ""}`}</pre>
            </section>
          }
          frame={
            framed
              ? (content, status) => (
                  <section className={styles.frame} aria-label="Terminal frame">
                    <section className={styles.screen} aria-label="Terminal screen">
                      {content}
                    </section>
                    <section aria-label="Terminal status">
                      {status.live ? "Live" : "Recorded"}
                      {status.queued ? " · queued" : status.busy ? " · busy" : ""}
                      {status.reason && ` · live unavailable: ${status.reason}`}
                    </section>
                  </section>
                )
              : undefined
          }
        />
      </section>
    </>
  );
}
