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
  width_cm?: number | null;
  height_cm?: number | null;
  depth_cm?: number | null;
  weight_kg?: number | null;
  options?: Record<string, unknown> | null;
};

const v = (x: unknown): string => {
  if (x === null || x === undefined || x === "") return "";
  return String(x);
};

const opt = (o: Record<string, unknown> | null | undefined, k: string) =>
  v(o?.[k]);

function buildCardRows(p: ProductRow): string[][] {
  const o = p.options ?? {};
  // По 2 пары "метка/значение" в строке (как в исходной 1С-карточке).
  const pairs: Array<[string, string]> = [
    ["Рабочее наименование:", v(p.name)],
    ["Наименование для печати:", v(p.name)],
    ["Артикул:", v(p.sku)],
    ["Стоимость:", v(p.price ?? "")],
    ["Длинна:", v(p.height_cm)],
    ["Ширина:", v(p.width_cm)],
    ["Толщина:", v(p.depth_cm)],
    ["Вес нетто:", v(p.weight_kg)],
    ["Вес брутто:", opt(o, "Вес брутто")],
    ["Материал:", opt(o, "Материал")],
    ["Порода:", opt(o, "Порода")],
    ["Покрытие:", opt(o, "Покрытие")],
    ["Площадь:", opt(o, "Площадь")],
    ["Объем:", opt(o, "Объем")],
    ["Упаковка:", opt(o, "Упаковка")],
    ["Наличие:", opt(o, "Наличие")],
    ["Марка (бренд):", opt(o, "Бренд")],
    ["Страна происхождения:", opt(o, "Страна")],
    ["Производитель (бренд):", opt(o, "Производитель")],
    ["Текстовое описание:", v(p.description)],
  ];

  const rows: string[][] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const a = pairs[i];
    const b = pairs[i + 1];
    rows.push(b ? [a[0], a[1], b[0], b[1]] : [a[0], a[1]]);
  }
  // Пустая строка-разделитель между карточками
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
