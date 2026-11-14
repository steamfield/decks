import { type ProductId, product } from "../data/products";

export function LangChip({ id }: { id: ProductId }) {
  return <span className="sf-lang">{product(id).lang}</span>;
}
