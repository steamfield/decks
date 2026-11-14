import { STAGE, stagger } from "@react-decks/kit";
import type { TreeNode } from "../data/types";
import styles from "./RepoTree.module.css";

export function RepoTree({
  nodes,
  lit = [],
  focus = "",
  reveal = 1,
  x,
  y,
  width,
  row = 40,
  root = "",
}: {
  nodes: readonly TreeNode[];
  lit?: readonly string[];
  focus?: string;
  reveal?: number;
  x: number;
  y: number;
  width: number;
  row?: number;
  root?: string;
}) {
  return (
    <div
      className={`sf-tree ${styles["sf-tree"]}`}
      style={{
        left: `${(x / STAGE.width) * 100}%`,
        top: `${(y / STAGE.height) * 100}%`,
        width: `${(width / STAGE.width) * 100}%`,
      }}
    >
      {root && (
        <div className={`sf-tree-root ${styles["sf-tree-root"]}`} style={{ opacity: reveal }}>
          {root}
        </div>
      )}
      {nodes.map((node, i) => {
        const p = stagger(reveal, i, nodes.length, 0.06);
        const focused = node.id === focus;
        const on = focused || lit.includes(node.id);
        return (
          <div
            key={node.id}
            className={`sf-tree-row ${styles["sf-tree-row"]}${on ? " is-on" : ""}${focused ? " is-focus" : ""}`}
            style={{
              height: `calc(${row / 10.8} * var(--sh))`,
              paddingLeft: `calc(${0.9 + node.depth * 1.35} * var(--sw))`,
              opacity: p * (on ? 1 : 0.45),
              transform: `translateY(${(1 - p) * 10}px)`,
            }}
          >
            <span className={`sf-tree-label ${styles["sf-tree-label"]}`}>{node.label}</span>
            {node.note && focused && (
              <span className={`sf-tree-note ${styles["sf-tree-note"]}`}>{node.note}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
