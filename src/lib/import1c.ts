// Парсер выгрузки 1С (XLSX, формат "карточка товара") → массив товаров для БД.
// Формат: пары "Метка: | значение" в строках. Несколько карточек идут подряд,
// каждая начинается со строки "Рабочее наименование:".

import * as XLSX from "xlsx";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

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
  _images?: { blob: Blob; name: string }[];
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
// Возвращает [{rows, startRow}] где startRow — 0-индекс строки начала карточки в листе.
function splitCards(rows: any[][]): { rows: any[][]; startRow: number; endRow: number }[] {
  const cards: { rows: any[][]; startRow: number; endRow: number }[] = [];
  let current: { rows: any[][]; startRow: number; endRow: number } | null = null;
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const firstLabel = (row.find((c) => clean(c)) ?? "") as string;
    if (typeof firstLabel === "string" && /Рабочее\s+наименование/i.test(firstLabel)) {
      if (current) {
        current.endRow = idx - 1;
        cards.push(current);
      }
      current = { rows: [row], startRow: idx, endRow: idx };
    } else if (current) {
      current.rows.push(row);
      current.endRow = idx;
    }
  }
  if (current) cards.push(current);
  return cards;
}

function readCard(card: any[][]): Record<string, string> {
  const dict: Record<string, string> = {};
  for (const row of card) {
    const cells = row.map((c) => clean(c));
    let i = 0;
    while (i < cells.length) {
      const cell = cells[i];
      if (cell && cell.endsWith(":")) {
        const label = cell.replace(/:+$/, "").trim();
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
  const discount_percent = Math.max(0, Math.min(100, num(d["Скидка"]) ?? 0));

  const height_cm = num(d["Длинна"] ?? d["Длина"]);
  const width_cm = num(d["Ширина"]);
  const depth_cm = num(d["Толщина"]);
  const weight_kg = num(d["Вес нетто"]);
  const weight_gross_kg = num(d["Вес брутто"]);
  const area_m2 = num(d["Площадь"]);
  const volume_m3 = num(d["Объем"]);

  const description = (d["Текстовое описание"] || "").trim() || null;

  const pickStr = (k: string): string | null => {
    const v = (d[k] || "").trim();
    if (!v || isPlaceholder(v)) return null;
    return v;
  };

  const material = pickStr("Материал");
  const wood_species = pickStr("Порода");
  const coating = pickStr("Покрытие");
  const package_info = pickStr("Упаковка");
  const stock_status = pickStr("Наличие");
  const brand = pickStr("Марка (бренд)");
  const country = pickStr("Страна происхождения");
  const manufacturer =
    pickStr("Производитель (бренд)") ||
    pickStr("Производитель, импортер (контрагент)");

  const optionsRaw: Record<string, string | null> = {
    Материал: material,
    Порода: wood_species,
    Покрытие: coating,
    Площадь: area_m2 != null ? String(area_m2) : null,
    Объем: volume_m3 != null ? String(volume_m3) : null,
    Упаковка: package_info,
    "Вес брутто": weight_gross_kg != null ? String(weight_gross_kg) : null,
    Наличие: stock_status,
    Бренд: brand,
    Страна: country,
    Производитель: manufacturer,
  };
  const options: Record<string, string> = {};
  for (const [k, v] of Object.entries(optionsRaw)) {
    if (v) options[k] = v;
  }

  return {
    sku, name, description, price, discount_percent, stock_status,
    width_cm, height_cm, depth_cm, weight_kg, weight_gross_kg,
    area_m2, volume_m3, package_info, material, wood_species, coating,
    brand, country, manufacturer, options,
  };
}

// ===== Извлечение изображений из XLSX =====
// Изображения в XLSX лежат в xl/media/, привязка через xl/drawings/drawingN.xml
// (anchor → fromRow). Связь sheet↔drawing — через rels.

type SheetImage = { sheetName: string; fromRow: number; mediaPath: string };

const mimeByExt: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
};

async function extractImages(buf: ArrayBuffer): Promise<SheetImage[]> {
  const out: SheetImage[] = [];
  try {
    const zip = await JSZip.loadAsync(buf);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

    // workbook.xml → sheet id ↔ name; workbook.xml.rels → sheet rId ↔ target
    const wbXml = await zip.file("xl/workbook.xml")?.async("string");
    const wbRelsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
    if (!wbXml || !wbRelsXml) return out;
    const wb = parser.parse(wbXml);
    const wbRels = parser.parse(wbRelsXml);

    const sheets = [].concat(wb?.workbook?.sheets?.sheet ?? []);
    const rels = [].concat(wbRels?.Relationships?.Relationship ?? []);
    const relById: Record<string, string> = {};
    for (const r of rels) relById[r["@_Id"]] = r["@_Target"];

    for (const s of sheets) {
      const sheetName = s["@_name"];
      const rId = s["@_r:id"] || s["@_id"];
      const target = relById[rId]; // напр. worksheets/sheet1.xml
      if (!target) continue;
      const sheetPath = `xl/${target.replace(/^\/?xl\//, "")}`;
      const sheetRelsPath = sheetPath.replace(/([^/]+)$/, "_rels/$1.rels");
      const sheetRelsXml = await zip.file(sheetRelsPath)?.async("string");
      if (!sheetRelsXml) continue;
      const sheetRels = parser.parse(sheetRelsXml);
      const sRels = [].concat(sheetRels?.Relationships?.Relationship ?? []);
      const drawingRel = sRels.find((r: any) => /drawing/i.test(r["@_Type"]));
      if (!drawingRel) continue;
      // sheetPath: xl/worksheets/sheet1.xml ; target: ../drawings/drawing1.xml
      const drawingPath = new URL(drawingRel["@_Target"], "http://x/" + sheetPath).pathname.replace(/^\//, "");
      const drawingXml = await zip.file(drawingPath)?.async("string");
      const drawingRelsPath = drawingPath.replace(/([^/]+)$/, "_rels/$1.rels");
      const drawingRelsXml = await zip.file(drawingRelsPath)?.async("string");
      if (!drawingXml || !drawingRelsXml) continue;

      const drawing = parser.parse(drawingXml);
      const dRels = [].concat(parser.parse(drawingRelsXml)?.Relationships?.Relationship ?? []);
      const mediaByRid: Record<string, string> = {};
      for (const r of dRels) {
        if (/image/i.test(r["@_Type"])) {
          mediaByRid[r["@_Id"]] = new URL(r["@_Target"], "http://x/" + drawingPath).pathname.replace(/^\//, "");
        }
      }

      // Все возможные anchor-типы
      const wsDr = drawing?.["xdr:wsDr"] ?? drawing?.wsDr ?? {};
      const anchors: any[] = [];
      for (const k of ["xdr:twoCellAnchor", "xdr:oneCellAnchor", "xdr:absoluteAnchor", "twoCellAnchor", "oneCellAnchor"]) {
        if (wsDr[k]) anchors.push(...[].concat(wsDr[k]));
      }
      for (const a of anchors) {
        const from = a["xdr:from"] ?? a.from;
        const fromRow = parseInt(from?.["xdr:row"] ?? from?.row ?? "0", 10) || 0;
        const pic = a["xdr:pic"] ?? a.pic;
        const blip = pic?.["xdr:blipFill"]?.["a:blip"] ?? pic?.blipFill?.blip;
        const embed = blip?.["@_r:embed"] || blip?.["@_xmlns:r"];
        // fast-xml-parser: namespaced attr keeps prefix
        const rid = blip?.["@_r:embed"];
        if (!rid) continue;
        const mediaPath = mediaByRid[rid];
        if (!mediaPath) continue;
        out.push({ sheetName, fromRow, mediaPath });
      }
    }

    // Прикрепляем blob к каждой записи
    for (const img of out) {
      const file = zip.file(img.mediaPath);
      if (file) {
        const blob = await file.async("blob");
        const ext = (img.mediaPath.split(".").pop() || "png").toLowerCase();
        const mime = mimeByExt[ext] || "image/png";
        (img as any).blob = new Blob([blob], { type: mime });
        (img as any).ext = ext;
      }
    }
  } catch (e) {
    console.warn("[import1c] image extraction failed:", e);
  }
  return out;
}

export async function parse1CFile(file: File): Promise<Parsed1CProduct[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const images = await extractImages(buf);

  const out: Parsed1CProduct[] = [];
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: true });
    const cards = splitCards(rows);
    const sheetImages = images.filter((i) => i.sheetName === sn);

    for (let ci = 0; ci < cards.length; ci++) {
      const card = cards[ci];
      const p = buildProduct(readCard(card.rows));
      if (!p) continue;

      // следующая карточка определяет верхнюю границу
      const nextStart = ci + 1 < cards.length ? cards[ci + 1].startRow : Infinity;
      const matched = sheetImages.filter(
        (img) => img.fromRow >= card.startRow && img.fromRow < nextStart,
      );
      if (matched.length) {
        p._images = matched
          .map((m: any) => m.blob ? { blob: m.blob as Blob, name: m.mediaPath.split("/").pop() || "image.png" } : null)
          .filter(Boolean) as { blob: Blob; name: string }[];
      }
      out.push(p);
    }
  }
  return out;
}
