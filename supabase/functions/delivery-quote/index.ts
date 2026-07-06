// Расчёт стоимости доставки в Яндекс Доставку, ПЭК и СДЭК.
// Вход: { city, address?, items: [{ weight_kg, width_cm, height_cm, depth_cm, price, quantity }] }
// Ответ: { yandex: {...}, pek: {...}, cdek: {...} }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadDeliveryCreds, type DeliveryCreds } from "../_shared/delivery-config.ts";

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

// Достаём настройки конкретного перевозчика с фолбэком на общий адрес
function providerCfg(sender: Record<string, any>, prefix: "cdek" | "pek" | "yandex") {
  return {
    city: sender[`${prefix}_city`] || sender.city || "",
    address: sender[`${prefix}_address`] || sender.address || "",
  };
}


// ===== Яндекс Доставка =====
async function quoteYandex(
  sender: Record<string, any>,
  creds: DeliveryCreds["yandex"],
  city: string,
  address: string,
  items: Item[],
) {
  if (!creds.token) return { ok: false, error: "Яндекс токен не настроен в админке" };
  try {
    const cfg = providerCfg(sender, "yandex");
    const fromAddress = cfg.address || cfg.city;
    if (!fromAddress) {
      return { ok: false, error: "Не указан адрес отправителя Яндекс в настройках админки" };
    }
    const sizeM = (cm?: number) => Math.max(0.1, (cm ?? 30) / 100);
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
        { fullname: fromAddress },
        { fullname: address || city },
      ],
      requirements: { taxi_class: "express" },
    };
    const r = await fetch(`${creds.baseUrl}/b2b/cargo/integration/v2/check-price`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "Accept-Language": "ru",
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) {
      if (text.includes("suitable_offer_not_found")) {
        return {
          ok: false,
          error: "Яндекс.Доставка доступна только внутри города. Для межгорода — СДЭК или ПЭК.",
        };
      }
      return { ok: false, error: `Yandex ${r.status}: ${text.slice(0, 200)}` };
    }
    const j = JSON.parse(text);
    const cost = Number(j.price ?? j.price_raw ?? 0);
    if (!cost) return { ok: false, error: "Яндекс не вернул стоимость (проверь адрес/тариф)" };
    return { ok: true, cost: Math.round(cost), days: "1–2 дня", raw: j };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}


// ===== ПЭК =====
type PekLookup = { id: number | null; authError?: string; notFound?: boolean; error?: string };
async function getPekCityId(creds: DeliveryCreds["pek"], cityName: string): Promise<PekLookup> {
  try {
    const auth = btoa(`${creds.login}:${creds.key}`);
    const r = await fetch(`${creds.baseUrl}/branches/branchesfilter`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filter: cityName }),
    });
    if (r.status === 401 || r.status === 403) {
      const text = await r.text();
      return { id: null, authError: `ПЭК ${r.status}: ключи не приняты. ${text.slice(0, 120)}` };
    }
    if (!r.ok) {
      const text = await r.text();
      return { id: null, error: `ПЭК ${r.status}: ${text.slice(0, 150)}` };
    }
    const raw = await r.text();
    if (!raw.trim()) return { id: null, error: "ПЭК вернул пустой ответ (проверьте base URL)" };
    const j = JSON.parse(raw);
    const branches: any[] = j?.branches ?? j?.items ?? [];
    if (!branches.length) return { id: null, notFound: true };
    const exact = branches.find(
      (b) => String(b.title ?? b.name ?? "").toLowerCase() === cityName.toLowerCase(),
    );
    const pick = exact ?? branches[0];
    const id = Number(pick?.id ?? pick?.branchId);
    return { id: Number.isFinite(id) && id > 0 ? id : null };
  } catch (e: any) {
    return { id: null, error: `Сеть: ${e?.message ?? e}` };
  }
}

async function quotePek(sender: Record<string, any>, creds: DeliveryCreds["pek"], city: string, items: Item[]) {
  if (!creds.login || !creds.key) return { ok: false, error: "ПЭК ключи не настроены в админке" };
  try {
    const pekCfg = providerCfg(sender, "pek");
    let senderCityId = Number(sender.pek_city_id);
    if (!Number.isFinite(senderCityId) || senderCityId <= 0) senderCityId = 0;
    if (!senderCityId) {
      if (!pekCfg.city) return { ok: false, error: "ПЭК: не указан город отправителя в админке" };
      const found = await getPekCityId(creds, String(pekCfg.city));
      if (found.authError) return { ok: false, error: found.authError };
      if (found.error) return { ok: false, error: found.error };
      if (found.notFound || !found.id) {
        return {
          ok: false,
          error: `ПЭК: город отправителя «${pekCfg.city}» не найден. Задайте ID города вручную в настройках.`,
        };
      }
      senderCityId = found.id;
    }
    const found = await getPekCityId(creds, city);
    if (found.authError) return { ok: false, error: found.authError };
    if (found.error) return { ok: false, error: found.error };
    if (found.notFound || !found.id) return { ok: false, error: `ПЭК: город получателя «${city}» не найден` };
    const receiverCityId = found.id;

    const cargos = items.flatMap((i) =>
      Array.from({ length: i.quantity }, () => ({
        length: Math.max(0.01, (i.depth_cm ?? 30) / 100),
        width: Math.max(0.01, (i.width_cm ?? 30) / 100),
        height: Math.max(0.01, (i.height_cm ?? 30) / 100),
        volume:
          Math.max(0.001, ((i.width_cm ?? 30) * (i.height_cm ?? 30) * (i.depth_cm ?? 30)) / 1_000_000),
        weight: Math.max(0.1, i.weight_kg ?? 1),
        sealingPositionsCount: 1,
        overSize: false,
      })),
    );
    const body = {
      senderCityId,
      receiverCityId,
      isOpenCarSender: false,
      isOpenCarReceiver: false,
      senderDistanceType: 1,
      receiverDistanceType: 1,
      isHigherThirdFloor: false,
      Cargos: cargos,
    };
    const auth = btoa(`${creds.login}:${creds.key}`);
    const r = await fetch(`${creds.baseUrl}/calculator/calculateprice`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    if (r.status === 401 || r.status === 403) {
      return { ok: false, error: `ПЭК ${r.status}: ключи не приняты. Проверьте логин/ключ в админке.` };
    }
    if (!r.ok) return { ok: false, error: `ПЭК ${r.status}: ${text.slice(0, 200)}` };
    const j = JSON.parse(text);
    const auto = j?.transfers?.auto ?? j?.auto ?? {};
    const cost =
      Number(auto.costWithNds ?? auto.cost ?? j?.total ?? j?.totalSum ?? j?.price ?? 0) || 0;
    const dayMin = auto.periodMin ?? j?.periodMin;
    const dayMax = auto.periodMax ?? j?.periodMax;
    const days = dayMin && dayMax ? `${dayMin}–${dayMax} дней` : "3–7 дней";
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

// ===== СДЭК =====
async function getCdekToken(creds: DeliveryCreds["cdek"]) {
  const r = await fetch(`${creds.baseUrl}/v2/oauth/token?parameters`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: creds.account,
      client_secret: creds.password,
    }).toString(),
  });
  const text = await r.text();
  if (!r.ok) {
    const hint = r.status === 401
      ? ` — ключи невалидны (режим «${creds.environment}»). Проверьте пару Account/Secure password в админке.`
      : "";
    throw new Error(`СДЭК auth ${r.status}: ${text.slice(0, 150)}${hint}`);
  }
  const j = JSON.parse(text);
  if (!j.access_token) throw new Error("CDEK auth: нет access_token");
  return j.access_token as string;
}

async function getCdekCityCode(creds: DeliveryCreds["cdek"], token: string, cityName: string): Promise<number | null> {
  try {
    const url = new URL(`${creds.baseUrl}/v2/location/cities`);
    url.searchParams.set("city", cityName);
    url.searchParams.set("country_codes", "RU");
    url.searchParams.set("size", "10");
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    const exact = j.find((c: any) => String(c.city ?? "").toLowerCase() === cityName.toLowerCase());
    const pick = exact ?? j[0];
    const code = Number(pick?.code);
    return Number.isFinite(code) && code > 0 ? code : null;
  } catch {
    return null;
  }
}

async function quoteCdek(sender: Record<string, any>, creds: DeliveryCreds["cdek"], city: string, items: Item[]) {
  if (!creds.account || !creds.password) return { ok: false, error: "СДЭК ключи не настроены в админке" };
  try {
    const token = await getCdekToken(creds);
    const cdekCfg = providerCfg(sender, "cdek");
    const fromCode =
      Number(sender.cdek_city_code) ||
      (await getCdekCityCode(creds, token, String(cdekCfg.city || "Москва")));
    const toCode = await getCdekCityCode(creds, token, city);
    if (!fromCode) return { ok: false, error: "Не определён город отправителя СДЭК" };
    if (!toCode) return { ok: false, error: `СДЭК: город «${city}» не найден` };

    const packages = items.flatMap((i) =>
      Array.from({ length: i.quantity }, () => ({
        weight: Math.max(100, Math.round((i.weight_kg ?? 1) * 1000)),
        length: Math.max(1, Math.round(i.depth_cm ?? 30)),
        width: Math.max(1, Math.round(i.width_cm ?? 30)),
        height: Math.max(1, Math.round(i.height_cm ?? 30)),
      })),
    );
    const tariffs = [137, 234, 136, 233];
    let best: { cost: number; days: string; raw: any; tariff: number } | null = null;
    let lastError = "";
    for (const tariff_code of tariffs) {
      const r = await fetch(`${creds.baseUrl}/v2/calculator/tariff`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tariff_code,
          from_location: { code: fromCode },
          to_location: { code: toCode },
          packages,
        }),
      });
      const text = await r.text();
      if (!r.ok) { lastError = `СДЭК ${r.status}: ${text.slice(0, 200)}`; continue; }
      const j = JSON.parse(text);
      const cost = Number(j?.total_sum ?? j?.delivery_sum ?? 0) || 0;
      if (cost > 0) {
        const dayMin = j?.period_min;
        const dayMax = j?.period_max;
        const days = dayMin && dayMax ? `${dayMin}–${dayMax} дней` : "3–7 дней";
        if (!best || cost < best.cost) best = { cost, days, raw: j, tariff: tariff_code };
      }
    }
    if (!best) return { ok: false, error: lastError || "СДЭК не вернул стоимость ни по одному тарифу" };
    return {
      ok: true,
      cost: Math.round(best.cost),
      days: best.days,
      raw: { ...best.raw, chosen_tariff: best.tariff },
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
    const [sender, creds] = await Promise.all([getSender(), loadDeliveryCreds(admin)]);
    const [yandex, pek, cdek] = await Promise.all([
      quoteYandex(sender, creds.yandex, String(city), String(address ?? ""), items as Item[]),
      quotePek(sender, creds.pek, String(city), items as Item[]),
      quoteCdek(sender, creds.cdek, String(city), items as Item[]),
    ]);
    return json({ yandex, pek, cdek });
  } catch (e: any) {
    console.error("delivery-quote error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

