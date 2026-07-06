// Диагностика перевозчиков: проверяет ключи и связь.
// Не пытается посчитать реальный тариф — только auth / поиск города.
// Вызывается из admin-api (action: delivery.diagnose), защищено паролем админа.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
const YANDEX_TOKEN = Deno.env.get("YANDEX_DELIVERY_TOKEN") ?? "";
const PEK_LOGIN = Deno.env.get("PEK_API_LOGIN") ?? "";
const PEK_KEY = Deno.env.get("PEK_API_KEY") ?? "";
const CDEK_ACCOUNT = Deno.env.get("CDEK_ACCOUNT") ?? "";
const CDEK_PASSWORD = Deno.env.get("CDEK_SECURE_PASSWORD") ?? "";

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

async function diagCdek(sender: Record<string, any>): Promise<Result> {
  if (!CDEK_ACCOUNT || !CDEK_PASSWORD) {
    return {
      ok: false, step: "config",
      message: "Не заданы переменные окружения CDEK_ACCOUNT / CDEK_SECURE_PASSWORD.",
      hint: "Добавьте их в .env на сервере и перезапустите контейнер functions.",
    };
  }
  // 1) Auth
  let token: string;
  try {
    const r = await fetch("https://api.cdek.ru/v2/oauth/token?parameters", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CDEK_ACCOUNT,
        client_secret: CDEK_PASSWORD,
      }).toString(),
    });
    const text = await r.text();
    if (!r.ok) {
      return {
        ok: false, step: "auth",
        message: `СДЭК auth ${r.status}: ${text.slice(0, 200)}`,
        hint: r.status === 401
          ? "Ключи СДЭК невалидны. В личном кабинете СДЭК → Настройки → Интеграция сгенерируйте новую пару Account/Secure password и обновите .env."
          : "Проблема на стороне СДЭК, попробуйте позже.",
      };
    }
    const j = JSON.parse(text);
    token = j.access_token;
    if (!token) {
      return { ok: false, step: "auth", message: "СДЭК не вернул access_token", details: j };
    }
  } catch (e: any) {
    return { ok: false, step: "auth", message: `Сеть: ${e?.message ?? e}` };
  }
  // 2) Поиск города отправителя
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
      const url = new URL("https://api.cdek.ru/v2/location/cities");
      url.searchParams.set("city", cityName);
      url.searchParams.set("country_codes", "RU");
      url.searchParams.set("size", "5");
      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await r.text();
      if (!r.ok) {
        return { ok: false, step: "sender_city", message: `СДЭК cities ${r.status}: ${text.slice(0, 200)}` };
      }
      const j = JSON.parse(text);
      if (!Array.isArray(j) || j.length === 0) {
        return {
          ok: false, step: "sender_city",
          message: `Город «${cityName}» не найден в справочнике СДЭК`,
          hint: "Уточните название или задайте «Код города СДЭК» вручную (найдите в ЛК СДЭК).",
        };
      }
      code = Number(j[0].code);
    }
    return {
      ok: true, step: "ok",
      message: `СДЭК работает. Город отправителя: код ${code}.`,
    };
  } catch (e: any) {
    return { ok: false, step: "sender_city", message: `Сеть: ${e?.message ?? e}` };
  }
}

async function diagPek(sender: Record<string, any>): Promise<Result> {
  if (!PEK_LOGIN || !PEK_KEY) {
    return {
      ok: false, step: "config",
      message: "Не заданы PEK_API_LOGIN / PEK_API_KEY в .env.",
      hint: "Добавьте ключи и перезапустите контейнер functions.",
    };
  }
  const cityName = sender.pek_city || sender.city || "";
  const forcedId = Number(sender.pek_city_id) || 0;
  if (!cityName && !forcedId) {
    return {
      ok: false, step: "sender_city",
      message: "Не указан город отправителя ПЭК.",
      hint: "Заполните «Адрес отправки — общий» или блок ПЭК в админке.",
    };
  }
  const auth = btoa(`${PEK_LOGIN}:${PEK_KEY}`);
  try {
    if (forcedId) {
      return {
        ok: true, step: "ok",
        message: `ПЭК: используется заданный ID города ${forcedId}. Auth не проверялся.`,
      };
    }
    const r = await fetch("https://kabinet.pecom.ru/api/v1/branches/branchesfilter", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filter: cityName }),
    });
    const text = await r.text();
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false, step: "auth",
        message: `ПЭК ${r.status}: ключи не приняты. ${text.slice(0, 150)}`,
        hint: "В ЛК ПЭК → Интеграции проверьте, что API-доступ активирован. Ключи выдаются по заявке, а не автоматически.",
      };
    }
    if (!r.ok) {
      return { ok: false, step: "cities", message: `ПЭК ${r.status}: ${text.slice(0, 200)}` };
    }
    const j = JSON.parse(text);
    const branches: any[] = j?.branches ?? j?.items ?? [];
    if (!branches.length) {
      return {
        ok: false, step: "sender_city",
        message: `ПЭК: город «${cityName}» не найден в справочнике`,
        hint: "Уточните название (например «Санкт-Петербург» без сокращений) или задайте ID города вручную.",
      };
    }
    const id = Number(branches[0]?.id ?? branches[0]?.branchId);
    return {
      ok: true, step: "ok",
      message: `ПЭК работает. Найден город: ${branches[0]?.title ?? branches[0]?.name} (id ${id}).`,
    };
  } catch (e: any) {
    return { ok: false, step: "network", message: `Сеть: ${e?.message ?? e}` };
  }
}

async function diagYandex(sender: Record<string, any>): Promise<Result> {
  if (!YANDEX_TOKEN) {
    return {
      ok: false, step: "config",
      message: "Не задан YANDEX_DELIVERY_TOKEN в .env.",
      hint: "Получите OAuth-токен в ЛК Яндекс.Доставки → Интеграции → Получить токен.",
    };
  }
  const fromAddress = sender.yandex_address || sender.address || sender.city || "";
  if (!fromAddress) {
    return {
      ok: false, step: "sender_city",
      message: "Не указан адрес отправителя Яндекс.",
      hint: "Заполните «Адрес отправки — общий» или блок «Яндекс.Доставка» в админке.",
    };
  }
  // Тестируем маршрут внутри одного города (адрес → адрес)
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
    const r = await fetch("https://b2b.taxi.yandex.net/b2b/cargo/integration/v2/check-price", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YANDEX_TOKEN}`,
        "Content-Type": "application/json",
        "Accept-Language": "ru",
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    if (r.status === 401 || r.status === 403) {
      return {
        ok: false, step: "auth",
        message: `Яндекс ${r.status}: токен не принят.`,
        hint: "Перегенерируйте OAuth-токен в ЛК Яндекс.Доставки.",
      };
    }
    if (!r.ok) {
      return {
        ok: false, step: "price",
        message: `Яндекс ${r.status}: ${text.slice(0, 200)}`,
        hint: "Проверьте, что адрес отправителя полный и распознаваем (город + улица + дом).",
      };
    }
    return {
      ok: true, step: "ok",
      message: "Яндекс работает. Токен валиден, адрес распознан.",
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
    const sender = await getSender();
    const [cdek, pek, yandex] = await Promise.all([
      diagCdek(sender), diagPek(sender), diagYandex(sender),
    ]);
    return json({
      data: {
        env: {
          CDEK_ACCOUNT: Boolean(CDEK_ACCOUNT),
          CDEK_SECURE_PASSWORD: Boolean(CDEK_PASSWORD),
          PEK_API_LOGIN: Boolean(PEK_LOGIN),
          PEK_API_KEY: Boolean(PEK_KEY),
          YANDEX_DELIVERY_TOKEN: Boolean(YANDEX_TOKEN),
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
