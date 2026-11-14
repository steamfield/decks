import { PRODUCTS, type ProductId } from "../data/products";
import { PixelIcon } from "./PixelIcon";

export function ThreadRail({ current, all }: { current?: ProductId; all?: boolean }) {
  const currentIndex = PRODUCTS.findIndex((p) => p.id === current);
  return (
    <nav className="sf-rail" aria-label="Where this slide is in the talk">
      {PRODUCTS.map((p, i) => (
        <div
          key={p.id}
          className={`sf-rail-item${i === currentIndex ? " is-current" : ""}${all || (currentIndex >= 0 && i < currentIndex) ? " is-done" : ""}`}
          aria-current={i === currentIndex ? "step" : undefined}
        >
          <PixelIcon className="sf-rail-icon" id={p.id} />
          <span className="sf-rail-text">
            <span className="sf-rail-verb">{p.verb}</span>
            <span className="sf-rail-name">{p.name}</span>
          </span>
        </div>
      ))}
    </nav>
  );
}
