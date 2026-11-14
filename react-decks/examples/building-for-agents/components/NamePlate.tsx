import { type ProductId, product } from "../data/products";
import { LangChip } from "./LangChip";
import { PixelIcon } from "./PixelIcon";

export function NamePlate({ id, chipOnly = false }: { id: ProductId; chipOnly?: boolean }) {
  const p = product(id);
  return (
    <div className="sf-plate">
      {!chipOnly && (
        <div className="sf-plate-row">
          <PixelIcon className="sf-plate-icon" id={p.id} />
          <span className="sf-plate-name">{p.name}</span>
        </div>
      )}
      <LangChip id={p.id} />
    </div>
  );
}
