import { Morph } from "@react-decks/motion";
import { useSlide } from "@react-decks/runtime";

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
