// Диагностика перевозчиков: проверяет ключи и связь.
// Не пытается посчитать реальный тариф — только auth / поиск города.
// Читает ключи из БД (app_settings.delivery_credentials), фолбэк — .env.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadDeliveryCreds, type DeliveryCreds } from "../_shared/delivery-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function getSender() {
  const { data } = await admin
    .from("app_settings").select("value").eq("key", "sender").maybeSingle();
  return (data?.value ?? {}) as Record<string, any>;
}

type Result = {
  ok: boolean;
  step: string;
  message: string;
  hint?: string;
  details?: any;
};

async function diagCdek(sender: Record<string, any>, creds: DeliveryCreds["cdek"]): Promise<Result> {
  if (!creds.account || !creds.password) {
    return {
      ok: false, step: "config",
      message: "Не заданы Account / Secure password СДЭК.",
      hint: "В админке → Настройки → «Ключи перевозчиков» вставьте пару из ЛК СДЭК → Настройки → Интеграция.",
    };
  }
  let token: string;
  try {
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
      return {
        ok: false, step: "auth",
        message: `СДЭК auth ${r.status} (${creds.environment}): ${text.slice(0, 200)}`,
        hint: r.status === 401
          ? `Ключи не приняты в режиме «${creds.environment}». Если это тестовая пара — переключите среду на «test»; если боевая — перевыпустите в ЛК СДЭК → Настройки → Интеграция.`
          : "Проблема на стороне СДЭК, попробуйте позже.",
      };
    }
    const j = JSON.parse(text);
    token = j.access_token;
    if (!token) return { ok: false, step: "auth", message: "СДЭК не вернул access_token", details: j };
  } catch (e: any) {
    return { ok: false, step: "auth", message: `Сеть: ${e?.message ?? e}` };
  }
  const cityName = sender.cdek_city || sender.city || "";
  if (!cityName && !sender.cdek_city_code) {
    return {
      ok: false, step: "sender_city",
      message: "Не указан город отправителя СДЭК.",
      hint: "Заполните в админке «Адрес отправки — общий» или блок СДЭК.",
    };
  }
  try {
    let code = Number(sender.cdek_city_code) || 0;
    if (!code) {
      const url = new URL(`${creds.baseUrl}/v2/location/cities`);
      url.searchParams.set("city", cityName);
      url.searchParams.set("country_codes", "RU");
      url.searchParams.set("size", "5");
      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const text = await r.text();
      if (!r.ok) return { ok: false, step: "sender_city", message: `СДЭК cities ${r.status}: ${text.slice(0, 200)}` };
      const j = JSON.parse(text);
      if (!Array.isArray(j) || j.length === 0) {
        return {
          ok: false, step: "sender_city",
          message: `Город «${cityName}» не найден в справочнике СДЭК`,
          hint: "Уточните название или задайте «Код города СДЭК» вручную.",
        };
      }
      code = Number(j[0].code);
    }
    return {
      ok: true, step: "ok",
      message: `СДЭК работает (${creds.environment}, ключ из ${creds.source}). Город отправителя: код ${code}.`,
    };
  } catch (e: any) {
    return { ok: false, step: "sender_city", message: `Сеть: ${e?.message ?? e}` };
  }
}

async function diagPek(sender: Record<string, any>, creds: DeliveryCreds["pek"]): Promise<Result> {
  if (!creds.login || !creds.key) {
    return {
      ok: false, step: "config",
      message: "Не заданы логин/ключ ПЭК.",
      hint: "В админке → Настройки → «Ключи перевозчиков» введите значения, полученные у менеджера ПЭК.",
    };
  }
  const cityName = sender.pek_city || sender.city || "";
  const forcedId = Number(sender.pek_city_id) || 0;
  if (!cityName && !forcedId) {
    return {
      ok: false, step: "sender_city",
      message: "Не указан город отправителя ПЭК.",
      hint: "Заполните «Адрес отправки — общий» или блок ПЭК.",
    };
  }
  const auth = btoa(`${creds.login}:${creds.key}`);
  try {
    if (forcedId) {
      return {
        ok: true, step: "ok",
        message: `ПЭК: используется заданный ID города ${forcedId}. Ключ из ${creds.source}.`,
      };
    }
    const r = await fetch(`${creds.baseUrl}/branches/branchesfilter`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filter: cityName }),
    });
    const text = await r.text();
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false, step: "auth",
        message: `ПЭК ${r.status}: ключи не приняты. ${text.slice(0, 150)}`,
        hint: "У ПЭК доступ к API выдаётся по заявке. Уточните у менеджера правильные логин/ключ и base URL.",
      };
    }
    if (!r.ok) {
      return {
        ok: false, step: "cities",
        message: `ПЭК ${r.status}: ${text.slice(0, 200) || "пустой ответ"}`,
        hint: "Проверьте base URL ПЭК в настройках — у некоторых клиентов свой хост.",
      };
    }
    if (!text.trim()) {
      return {
        ok: false, step: "cities",
        message: "ПЭК вернул пустой ответ.",
        hint: "Проверьте правильность base URL ПЭК.",
      };
    }
    const j = JSON.parse(text);
    const branches: any[] = j?.branches ?? j?.items ?? [];
    if (!branches.length) {
      return {
        ok: false, step: "sender_city",
        message: `ПЭК: город «${cityName}» не найден`,
        hint: "Уточните название или задайте ID города вручную.",
      };
    }
    const id = Number(branches[0]?.id ?? branches[0]?.branchId);
    return {
      ok: true, step: "ok",
      message: `ПЭК работает (ключ из ${creds.source}). Город: ${branches[0]?.title ?? branches[0]?.name} (id ${id}).`,
    };
  } catch (e: any) {
    return { ok: false, step: "network", message: `Сеть: ${e?.message ?? e}` };
  }
}

async function diagYandex(sender: Record<string, any>, creds: DeliveryCreds["yandex"]): Promise<Result> {
  if (!creds.token) {
    return {
      ok: false, step: "config",
      message: "Не задан OAuth-токен Яндекс.Доставки.",
      hint: "В админке → Настройки → «Ключи перевозчиков» вставьте токен из ЛК Яндекс.Доставки → Интеграции.",
    };
  }
  const fromAddress = sender.yandex_address || sender.address || sender.city || "";
  if (!fromAddress) {
    return {
      ok: false, step: "sender_city",
      message: "Не указан адрес отправителя Яндекс.",
      hint: "Заполните «Адрес отправки — общий» или блок Яндекс.",
    };
  }
  const body = {
    items: [{
      quantity: 1,
      size: { length: 0.3, width: 0.3, height: 0.3 },
      weight: 1,
      cost_value: "1000",
      cost_currency: "RUB",
      title: "test",
    }],
    route_points: [{ fullname: fromAddress }, { fullname: fromAddress }],
    requirements: { taxi_class: "express" },
  };
  try {
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
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false, step: "auth",
        message: `Яндекс ${r.status}: токен не принят (${creds.environment}).`,
        hint: "Перегенерируйте OAuth-токен в ЛК Яндекс.Доставки → Интеграции.",
      };
    }
    // 409 suitable_offer_not_found = токен и адрес ок, просто нет тарифа между двумя одинаковыми точками
    if (!r.ok && !text.includes("suitable_offer_not_found")) {
      return {
        ok: false, step: "price",
        message: `Яндекс ${r.status}: ${text.slice(0, 200)}`,
        hint: "Проверьте адрес отправителя (город + улица + дом).",
      };
    }
    return {
      ok: true, step: "ok",
      message: `Яндекс работает (${creds.environment}, ключ из ${creds.source}). Токен валиден, адрес распознан.`,
    };
  } catch (e: any) {
    return { ok: false, step: "network", message: `Сеть: ${e?.message ?? e}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const password = req.headers.get("x-admin-password") ?? "";
    if (!ADMIN_PASSWORD || !safeEqual(password, ADMIN_PASSWORD)) {
      return json({ error: "Unauthorized" }, 401);
    }
    const [sender, creds] = await Promise.all([getSender(), loadDeliveryCreds(admin)]);
    const [cdek, pek, yandex] = await Promise.all([
      diagCdek(sender, creds.cdek),
      diagPek(sender, creds.pek),
      diagYandex(sender, creds.yandex),
    ]);
    return json({
      data: {
        env: {
          CDEK: creds.cdek.source,
          PEK: creds.pek.source,
          YANDEX: creds.yandex.source,
        },
        sources: {
          cdek: { source: creds.cdek.source, environment: creds.cdek.environment, baseUrl: creds.cdek.baseUrl },
          pek:  { source: creds.pek.source,  baseUrl: creds.pek.baseUrl },
          yandex: { source: creds.yandex.source, environment: creds.yandex.environment, baseUrl: creds.yandex.baseUrl },
        },
        sender,
        cdek, pek, yandex,
      },
    });
  } catch (e: any) {
    console.error("delivery-diagnose error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
