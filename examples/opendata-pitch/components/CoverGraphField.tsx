import { Graph3D } from "@steamfield/decks/kit";
import { graphEdges, graphNodes } from "../data/graph-data";
import { COVER_DIM, GRAPH_ZOOM } from "../data/graph-view";
import styles from "./CoverGraphField.module.css";

export function CoverGraphField() {
  return (
    <div className={styles.field}>
      <Graph3D nodes={graphNodes} edges={graphEdges} orbit zoom={GRAPH_ZOOM} dim={COVER_DIM} />
      <div className={styles.scrim} />
    </div>
  );
}
