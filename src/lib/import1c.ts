// Парсер выгрузки 1С (XLSX, формат "карточка товара") → массив товаров для БД.
// Формат: пары "Метка: | значение" в строках. Несколько карточек идут подряд,
// каждая начинается со строки "Рабочее наименование:".

import * as XLSX from "xlsx";

export type Parsed1CProduct = {
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  discount_percent: number;
  stock_status: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  weight_kg: number | null;
  weight_gross_kg: number | null;
  area_m2: number | null;
  volume_m3: number | null;
  package_info: string | null;
  material: string | null;
  wood_species: string | null;
  coating: string | null;
  brand: string | null;
  country: string | null;
  manufacturer: string | null;
  options: Record<string, string>;
};

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s/g, "").replace(",", ".");
  if (!s || s === "<неизмеряется>" || s === "неуказан") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const clean = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

const isPlaceholder = (s: string) =>
  !s ||
  /<не\s*(указан|указана|измеряется)>/i.test(s) ||
  /^не\s*используются?$/i.test(s);

// Из плоской матрицы вырезаем "карточки" по якорю "Рабочее наименование:"
function splitCards(rows: any[][]): any[][][] {
  const cards: any[][][] = [];
  let current: any[][] | null = null;
  for (const row of rows) {
    const firstLabel = (row.find((c) => clean(c)) ?? "") as string;
    if (typeof firstLabel === "string" && /Рабочее\s+наименование/i.test(firstLabel)) {
      if (current) cards.push(current);
      current = [row];
    } else if (current) {
      current.push(row);
    }
  }
  if (current) cards.push(current);
  return cards;
}

// Из карточки строим словарь меток. Метка — первая непустая ячейка с ":" на конце,
// значение — следующая непустая ячейка справа. В одной строке может быть до 2 пар
// (левая и правая колонка карточки 1С).
function readCard(card: any[][]): Record<string, string> {
  const dict: Record<string, string> = {};
  for (const row of card) {
    const cells = row.map((c) => clean(c));
    let i = 0;
    while (i < cells.length) {
      const cell = cells[i];
      if (cell && cell.endsWith(":")) {
        const label = cell.replace(/:+$/, "").trim();
        // ищем первое непустое значение справа, но не следующую метку
        let val = "";
        for (let j = i + 1; j < cells.length; j++) {
          const next = cells[j];
          if (!next) continue;
          if (next.endsWith(":")) break;
          val = next;
          i = j;
          break;
        }
        if (label && !(label in dict)) dict[label] = val;
      }
      i++;
    }
  }
  return dict;
}

function buildProduct(d: Record<string, string>): Parsed1CProduct | null {
  const name = d["Наименование для печати"] || d["Рабочее наименование"];
  if (!name) return null;

  const sku = d["Артикул"] || null;
  const price = num(d["Стоимость"]) ?? 0;

  // 1С: Длинна = длина (=высота для панно), Ширина, Толщина (=глубина)
  const height_cm = num(d["Длинна"] ?? d["Длина"]);
  const width_cm = num(d["Ширина"]);
  const depth_cm = num(d["Толщина"]);
  const weight_kg = num(d["Вес нетто"]) ?? num(d["Вес брутто"]);

  const description = (d["Текстовое описание"] || "").trim() || null;

  const optionsRaw: Record<string, string> = {
    Материал: d["Материал"],
    Порода: d["Порода"],
    Покрытие: d["Покрытие"],
    Площадь: d["Площадь"],
    Объем: d["Объем"],
    Упаковка: d["Упаковка"],
    "Вес брутто": d["Вес брутто"],
    Наличие: d["Наличие"],
    Бренд: d["Марка (бренд)"],
    Страна: d["Страна происхождения"],
    Производитель: d["Производитель (бренд)"] || d["Производитель, импортер (контрагент)"],
  };
  const options: Record<string, string> = {};
  for (const [k, v] of Object.entries(optionsRaw)) {
    if (v && !isPlaceholder(v)) options[k] = v;
  }

  return {
    sku,
    name,
    description,
    price,
    width_cm,
    height_cm,
    depth_cm,
    weight_kg,
    options,
  };
}

export async function parse1CFile(file: File): Promise<Parsed1CProduct[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const out: Parsed1CProduct[] = [];
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: true });
    for (const card of splitCards(rows)) {
      const dict = readCard(card);
      const p = buildProduct(dict);
      if (p) out.push(p);
    }
  }
  return out;
}
