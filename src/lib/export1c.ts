// Экспорт товаров в XLSX в формате "карточки 1С" (round-trip с import1c.ts).
// Каждая карточка идёт подряд: первая ячейка строки — метка с двоеточием,
// далее значение. Первая метка карточки — "Рабочее наименование:".

import * as XLSX from "xlsx";

type ProductRow = {
  sku?: string | null;
  name: string;
  description?: string | null;
  category?: string;
  price?: number | string;
  discount_percent?: number | string | null;
  stock_status?: string | null;
  width_cm?: number | null;
  height_cm?: number | null;
  depth_cm?: number | null;
  weight_kg?: number | null;
  weight_gross_kg?: number | null;
  area_m2?: number | null;
  volume_m3?: number | null;
  package_info?: string | null;
  material?: string | null;
  wood_species?: string | null;
  coating?: string | null;
  brand?: string | null;
  country?: string | null;
  manufacturer?: string | null;
  options?: Record<string, unknown> | null;
};

const v = (x: unknown): string => {
  if (x === null || x === undefined || x === "") return "";
  return String(x);
};

const opt = (o: Record<string, unknown> | null | undefined, k: string) =>
  v(o?.[k]);

// Берём значение из колонки сначала, иначе fallback в options.
const f = (
  direct: unknown,
  o: Record<string, unknown> | null | undefined,
  k: string,
) => {
  const dv = v(direct);
  return dv || opt(o, k);
};

function buildCardRows(p: ProductRow): string[][] {
  const o = p.options ?? {};
  const pairs: Array<[string, string]> = [
    ["Рабочее наименование:", v(p.name)],
    ["Наименование для печати:", v(p.name)],
    ["Артикул:", v(p.sku)],
    ["Стоимость:", v(p.price ?? "")],
    ["Скидка:", v(p.discount_percent ?? "")],
    ["Длинна:", v(p.height_cm)],
    ["Ширина:", v(p.width_cm)],
    ["Толщина:", v(p.depth_cm)],
    ["Вес нетто:", v(p.weight_kg)],
    ["Вес брутто:", f(p.weight_gross_kg, o, "Вес брутто")],
    ["Материал:", f(p.material, o, "Материал")],
    ["Порода:", f(p.wood_species, o, "Порода")],
    ["Покрытие:", f(p.coating, o, "Покрытие")],
    ["Площадь:", f(p.area_m2, o, "Площадь")],
    ["Объем:", f(p.volume_m3, o, "Объем")],
    ["Упаковка:", f(p.package_info, o, "Упаковка")],
    ["Наличие:", f(p.stock_status, o, "Наличие")],
    ["Марка (бренд):", f(p.brand, o, "Бренд")],
    ["Страна происхождения:", f(p.country, o, "Страна")],
    ["Производитель (бренд):", f(p.manufacturer, o, "Производитель")],
    ["Текстовое описание:", v(p.description)],
  ];

  const rows: string[][] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const a = pairs[i];
    const b = pairs[i + 1];
    rows.push(b ? [a[0], a[1], b[0], b[1]] : [a[0], a[1]]);
  }
  rows.push([]);
  return rows;
}

export function exportProductsTo1CXlsx(products: ProductRow[]): Blob {
  const allRows: string[][] = [];
  for (const p of products) {
    for (const r of buildCardRows(p)) allRows.push(r);
  }
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws["!cols"] = [{ wch: 28 }, { wch: 40 }, { wch: 28 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Товары");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
