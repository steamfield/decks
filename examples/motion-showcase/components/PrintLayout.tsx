import type { ReactNode } from "react";
import styles from "./PrintLayout.module.css";

export function PrintLayout({
  scene,
  children,
}: {
  scene: "cover" | "carving" | "inking" | "detail" | "press" | "proof" | "school";
  children: ReactNode;
}) {
  return <div className={`${styles.spread} ${styles[scene]}`}>{children}</div>;
}
