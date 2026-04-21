// Расчёт стоимости доставки в Яндекс Доставку и ПЭК.
// Вход: { city, address?, items: [{ weight_kg, width_cm, height_cm, depth_cm, price, quantity }] }
// Ответ: { yandex: { ok, cost?, days?, error? }, pek: { ok, cost?, days?, error? } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Item {
  weight_kg?: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  price: number;
  quantity: number;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YANDEX_TOKEN = Deno.env.get("YANDEX_DELIVERY_TOKEN") ?? "";
const PEK_LOGIN = Deno.env.get("PEK_API_LOGIN") ?? "";
const PEK_KEY = Deno.env.get("PEK_API_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getSender() {
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "sender")
    .maybeSingle();
  return (data?.value ?? {}) as Record<string, any>;
}

// ===== Яндекс Доставка: check-price =====
// Документация: https://yandex.ru/dev/logistics/doc/dg/api-claim-check-price-doc.html
async function quoteYandex(sender: Record<string, any>, city: string, address: string, items: Item[]) {
  if (!YANDEX_TOKEN) return { ok: false, error: "Яндекс токен не настроен" };
  try {
    const totalWeightKg = Math.max(
      0.5,
      items.reduce((s, i) => s + (i.weight_kg ?? 1) * i.quantity, 0),
    );
    // Габариты — берём максимальные из товаров (упрощённо)
    const sizeM = (cm?: number) => Math.max(0.1, (cm ?? 30) / 100);
    const maxW = Math.max(...items.map((i) => sizeM(i.width_cm)));
    const maxH = Math.max(...items.map((i) => sizeM(i.height_cm)));
    const maxD = Math.max(...items.map((i) => sizeM(i.depth_cm)));

    const body = {
      items: items.map((i, idx) => ({
        quantity: i.quantity,
        size: { length: sizeM(i.depth_cm), width: sizeM(i.width_cm), height: sizeM(i.height_cm) },
        weight: i.weight_kg ?? 1,
        cost_value: String(i.price),
        cost_currency: "RUB",
        title: `item-${idx + 1}`,
      })),
      route_points: [
        {
          coordinates: undefined,
          fullname: sender.address ?? "",
        },
        {
          coordinates: undefined,
          fullname: address || city,
        },
      ],
      requirements: { taxi_class: "express" },
    };

    const r = await fetch("https://b2b.taxi.yandex.net/api/b2b/cargo/integration/v2/check-price", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YANDEX_TOKEN}`,
        "Content-Type": "application/json",
        "Accept-Language": "ru",
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, error: `Yandex ${r.status}: ${text.slice(0, 200)}` };
    const j = JSON.parse(text);
    const cost = Number(j.price ?? j.price_raw ?? 0);
    return {
      ok: true,
      cost: Math.round(cost),
      days: "1–2 дня",
      raw: j,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// ===== ПЭК: calculator =====
// Документация: https://pecom.ru/services-are/raschet-dostavki/
async function quotePek(sender: Record<string, any>, city: string, items: Item[]) {
  if (!PEK_LOGIN || !PEK_KEY) return { ok: false, error: "ПЭК ключи не настроены" };
  try {
    const totalWeight = items.reduce((s, i) => s + (i.weight_kg ?? 1) * i.quantity, 0);
    const totalVolume = items.reduce((s, i) => {
      const v = ((i.width_cm ?? 30) * (i.height_cm ?? 30) * (i.depth_cm ?? 30)) / 1_000_000;
      return s + v * i.quantity;
    }, 0);

    const body = {
      senderCityId: sender.pek_city_id || "",
      receiverCityName: city,
      cargo: {
        weight: Math.max(0.5, totalWeight),
        volume: Math.max(0.01, totalVolume),
      },
      transferType: "auto",
    };

    const auth = btoa(`${PEK_LOGIN}:${PEK_KEY}`);
    const r = await fetch("https://kabinet.pecom.ru/api/v1/calculator/calculateprice", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, error: `ПЭК ${r.status}: ${text.slice(0, 200)}` };
    const j = JSON.parse(text);
    // Структура ответа ПЭК: суммарная стоимость в j.total или j.transfer
    const cost =
      Number(j?.total ?? j?.transfer ?? j?.price ?? j?.totalSum ?? 0) || 0;
    const days = j?.periodMin && j?.periodMax ? `${j.periodMin}–${j.periodMax} дней` : "3–7 дней";
    return {
      ok: cost > 0,
      cost: Math.round(cost),
      days,
      raw: j,
      error: cost > 0 ? undefined : "ПЭК не вернул стоимость",
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { city, address, items } = await req.json();
    if (!city || !Array.isArray(items) || items.length === 0) {
      return json({ error: "city и items обязательны" }, 400);
    }
    const sender = await getSender();
    const [yandex, pek] = await Promise.all([
      quoteYandex(sender, String(city), String(address ?? ""), items as Item[]),
      quotePek(sender, String(city), items as Item[]),
    ]);
    return json({ yandex, pek });
  } catch (e: any) {
    console.error("delivery-quote error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
