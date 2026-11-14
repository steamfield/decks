import { useSlide } from "@steamfield/decks";
import { Morph } from "@steamfield/decks/motion";

export function MorphSteps() {
  const { clicks } = useSlide();
  return (
    <div className="morph-field">
      <span className="morph-origin">START HERE</span>
      <span className="morph-destination">LAND HERE</span>
      <Morph name="step-card" className={`morph-card ${clicks ? "expanded" : "compact"}`}>
        <small>ONE CLICK</small>
        <strong>
          Keep
          <br />
          the thread.
        </strong>
      </Morph>
    </div>
  );
}
