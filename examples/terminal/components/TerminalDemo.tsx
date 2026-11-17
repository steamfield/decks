import { useSlide } from "@steamfield/decks";
import { LiveTerm } from "@steamfield/decks/kit";

const pane = { id: "hello", rows: 12, cols: 60, cwd: "temp", commands: ["echo hello", "ls"] };

export function TerminalDemo() {
  const { clicks } = useSlide();
  return (
    <div style={{ height: 420 }}>
      <LiveTerm
        pane={pane}
        click={clicks}
        fallback={
          <section aria-label="Terminal recording">
            <pre>{`$ ${clicks >= 1 ? "echo hello\nhello\n$ " : ""}${clicks >= 2 ? "ls\n$ " : ""}`}</pre>
          </section>
        }
      />
    </div>
  );
}
