import { PRODUCTS, type ProductId } from "../data/products";
import { PixelIcon } from "./PixelIcon";
import styles from "./ThreadRail.module.css";

export function ThreadRail({ current, all }: { current?: ProductId; all?: boolean }) {
  const currentIndex = PRODUCTS.findIndex((p) => p.id === current);
  return (
    <nav className={`sf-rail ${styles["sf-rail"]}`} aria-label="Where this slide is in the talk">
      {PRODUCTS.map((p, i) => (
        <a
          key={p.id}
          href={p.site}
          target="_blank"
          rel="noreferrer"
          className={`sf-rail-item ${styles["sf-rail-item"]}${i === currentIndex ? " is-current" : ""}${all || (currentIndex >= 0 && i < currentIndex) ? " is-done" : ""}`}
          aria-current={i === currentIndex ? "step" : undefined}
        >
          <PixelIcon className={`sf-rail-icon ${styles["sf-rail-icon"]}`} id={p.id} />
          <span className={`sf-rail-text ${styles["sf-rail-text"]}`}>
            <span className={`sf-rail-verb ${styles["sf-rail-verb"]}`}>{p.verb}</span>
            <span className={`sf-rail-name ${styles["sf-rail-name"]}`}>{p.name}</span>
          </span>
        </a>
      ))}
    </nav>
  );
}
