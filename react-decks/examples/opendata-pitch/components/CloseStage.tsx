import { Graph3D, OdQrCard, StoryCover } from "@steamfield/decks/kit";
import { graphEdges, graphNodes } from "../data/graph-data";
import { COVER_DIM, GRAPH_ZOOM } from "../data/graph-view";
import { QR_FRAME_VARS } from "../data/qr-frame";
import styles from "./CloseStage.module.css";

export function CloseStage() {
  return (
    <StoryCover
      url="tryopendata.ai"
      center
      field={
        <div className={styles.graph}>
          <Graph3D nodes={graphNodes} edges={graphEdges} orbit zoom={GRAPH_ZOOM} dim={COVER_DIM} />
          <div className={styles.scrim} />
        </div>
      }
      title={
        <>
          Every dataset discoverable.
          <br />
          Every claim verifiable.
        </>
      }
      aside={
        <div className={styles.qr} style={QR_FRAME_VARS}>
          <div className={`vt-qr-frame ${styles.morph}`}>
            <OdQrCard url="https://tryopendata.ai" ariaLabel="QR code to tryopendata.ai" />
          </div>
          <span className="od-eyebrow">tryopendata.ai</span>
        </div>
      }
    />
  );
}
