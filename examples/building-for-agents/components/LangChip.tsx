import { type ProductId, product } from "../data/products";
import styles from "./LangChip.module.css";

export function LangChip({ id }: { id: ProductId }) {
  return <span className={`sf-lang ${styles["sf-lang"]}`}>{product(id).lang}</span>;
}
