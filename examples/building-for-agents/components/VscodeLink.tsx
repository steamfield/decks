import type { ReactNode } from "react";
import styles from "./VscodeLink.module.css";

const HOME = "/Users/riley";

/** Opens a file (optionally at a line) or a folder in the local VS Code. `~` and `~/Projects` paths are the author's machine. */
export function VscodeLink({
  path,
  line,
  children,
}: {
  path: string;
  line?: number;
  children: ReactNode;
}) {
  const absolute = path.startsWith("~/") ? `${HOME}${path.slice(1)}` : path;
  return (
    <a
      className={styles.link}
      href={`vscode://file${absolute}${line === undefined ? "" : `:${line}`}`}
    >
      {children}
    </a>
  );
}
