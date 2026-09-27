import type { CartItem } from "@/contexts/CartContext";
import { cartLineId } from "@/contexts/CartContext";

const num = (s?: string) => {
  const m = (s || "").match(/[\d.,]+/);
  return m ? parseFloat(m[0].replace(",", ".")) : 0;
};
const fmt = (n: number, d = 3) => String(Math.round(n * 10 ** d) / 10 ** d).replace(".", ",");

/** Таблица габаритов по товарам: товар, габариты, площадь, вес, объём */
const OrderDimsSummary = ({ items, packed = false }: { items: CartItem[]; packed?: boolean }) => {
  const rows = items.map((i) => ({
    id: cartLineId(i),
    name: i.name,
    qty: i.quantity,
    dims: (packed ? i.packedDimensions : undefined) ?? i.dimensions ?? "—",
    area: (packed ? i.packedAreaM2 : undefined) ?? i.areaM2,
    weight: num((packed ? i.packedWeight : undefined) ?? i.weight),
    volume: (packed ? i.packedVolumeM3 : undefined) ?? i.volumeM3,
  }));
  if (!rows.length) return null;
  return (
    <div className="border-t border-border/30 pt-3 space-y-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {packed ? "Габаритные размеры с упаковкой" : "Габариты"}
      </p>
      {rows.map((r) => (
        <dl key={r.id} className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Товар</dt>
          <dd className="text-foreground text-right">{r.name}{r.qty > 1 ? ` × ${r.qty}` : ""}</dd>
          <dt className="text-muted-foreground">Габариты, см</dt>
          <dd className="text-foreground text-right">{r.dims.replace(/\s*см$/, "")}</dd>
          <dt className="text-muted-foreground">Площадь, м²</dt>
          <dd className="text-foreground text-right">{r.area ? fmt(r.area, 4) : "—"}</dd>
          <dt className="text-muted-foreground">Вес, кг</dt>
          <dd className="text-foreground text-right">{r.weight ? fmt(r.weight, 2) : "—"}</dd>
          <dt className="text-muted-foreground">Объём, м³</dt>
          <dd className="text-foreground text-right">{r.volume ? fmt(r.volume, 4) : "—"}</dd>
        </dl>
      ))}
    </div>
  );
};

export default OrderDimsSummary;
