import { useSlide } from "@steamfield/decks";
import { Morph } from "@steamfield/decks/motion";

/** One card that grows from a chip into a panel on the slide's first click. */
export function MorphSteps() {
  const { clicks } = useSlide();
  const open = clicks > 0;
  return (
    <div style={{ display: "flex", justifyContent: open ? "center" : "flex-start", width: 1500 }}>
      <Morph name="step-card">
        <div
          style={{
            width: open ? 1000 : 420,
            padding: open ? "56px 64px" : "24px 32px",
            borderRadius: 24,
            background: "var(--od-surface-raised)",
            border: "2px solid var(--od-cyan)",
          }}
        >
          <div className="od-eyebrow">Next release</div>
          <div className={open ? "od-h2" : "od-h3"} style={{ marginTop: 12 }}>
            Offline mode
          </div>
          {open ? (
            <p className="od-body">
              Lesson plans open without a connection and sync when one returns.
            </p>
          ) : null}
        </div>
      </Morph>
    </div>
  );
}
