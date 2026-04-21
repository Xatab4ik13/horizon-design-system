// Создание заказа клиентом + автосоздание заявки в Я.Доставку/ПЭК (если применимо).
// Открытая функция (без админ-пароля), но с серверной валидацией входа.
// Заказ создаётся от service-role; затем при провайдере yandex/pek — заявка у перевозчика,
// и в orders сохраняются delivery_external_id / delivery_tracking / delivery_payload.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YANDEX_TOKEN = Deno.env.get("YANDEX_DELIVERY_TOKEN") ?? "";
const PEK_LOGIN = Deno.env.get("PEK_API_LOGIN") ?? "";
const PEK_KEY = Deno.env.get("PEK_API_KEY") ?? "";
const CDEK_ACCOUNT = Deno.env.get("CDEK_ACCOUNT") ?? "";
const CDEK_PASSWORD = Deno.env.get("CDEK_SECURE_PASSWORD") ?? "";

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

// ===== Создание заявки в Яндекс.Доставке =====
async function createYandexClaim(order: any, sender: Record<string, any>) {
  if (!YANDEX_TOKEN) throw new Error("YANDEX_DELIVERY_TOKEN не настроен");
  const items = (order.items as any[]).map((i, idx) => ({
    pickup_point: 1,
    droppof_point: 2,
    title: i.name ?? `item-${idx + 1}`,
    quantity: i.quantity ?? 1,
    cost_value: String(i.price ?? 0),
    cost_currency: "RUB",
    weight: 1,
    size: { length: 0.3, width: 0.3, height: 0.3 },
  }));
  const body = {
    items,
    route_points: [
      {
        point_id: 1,
        visit_order: 1,
        type: "source",
        address: { fullname: sender.address ?? "" },
        contact: {
          name: sender.contact_name ?? "FAKTURA",
          phone: sender.contact_phone ?? "+79991234567",
        },
      },
      {
        point_id: 2,
        visit_order: 2,
        type: "destination",
        address: { fullname: order.delivery_address || order.delivery_city || "" },
        contact: { name: order.customer_name, phone: order.customer_phone },
      },
    ],
    skip_door_to_door: false,
    skip_client_notify: false,
    skip_emergency_notify: false,
  };
  const requestId = crypto.randomUUID();
  const r = await fetch(
    `https://b2b.taxi.yandex.net/api/b2b/cargo/integration/v2/claims/create?request_id=${requestId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YANDEX_TOKEN}`,
        "Content-Type": "application/json",
        "Accept-Language": "ru",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`Yandex ${r.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text);
  return { external_id: j.id ?? requestId, tracking: j.id ?? "", raw: j };
}

// ===== Создание заявки в ПЭК =====
async function createPekOrder(order: any, sender: Record<string, any>) {
  if (!PEK_LOGIN || !PEK_KEY) throw new Error("ПЭК ключи не настроены");
  const auth = btoa(`${PEK_LOGIN}:${PEK_KEY}`);
  const totalWeight = (order.items as any[]).reduce(
    (s: number, i: any) =>
      s + (i.weight ? Number(String(i.weight).replace(/[^0-9.]/g, "")) || 1 : 1) * (i.quantity ?? 1),
    0,
  );
  const body = {
    senderCityId: sender.pek_city_id || "",
    receiverCityName: order.delivery_city || order.delivery_address || "",
    receiverContactName: order.customer_name,
    receiverPhone: order.customer_phone,
    cargo: { weight: Math.max(0.5, totalWeight), places: order.items.length },
  };
  const r = await fetch("https://kabinet.pecom.ru/api/v1/orders/create", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`ПЭК ${r.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text);
  return {
    external_id: String(j?.orderID ?? j?.id ?? ""),
    tracking: String(j?.orderID ?? j?.id ?? ""),
    raw: j,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      user_id = null,
      customer_name,
      customer_phone,
      customer_email = null,
      delivery_method,
      delivery_address = null,
      delivery_provider = null,
      delivery_city = null,
      delivery_cost = null,
      delivery_days = null,
      payment_method,
      items,
      comment = null,
      total_amount,
    } = body ?? {};

    // Базовая валидация (ловим то же, что и RLS, но с понятной ошибкой клиенту)
    if (
      typeof customer_name !== "string" ||
      customer_name.trim().length < 2 ||
      typeof customer_phone !== "string" ||
      customer_phone.trim().length < 5 ||
      typeof delivery_method !== "string" ||
      typeof payment_method !== "string" ||
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof total_amount !== "number" ||
      total_amount < 0
    ) {
      return json({ error: "Некорректные данные заказа" }, 400);
    }
    if (delivery_provider && !["yandex", "pek", "pickup"].includes(delivery_provider)) {
      return json({ error: "Неизвестный провайдер доставки" }, 400);
    }

    // 1) Создаём заказ
    const { data: order, error: insErr } = await admin
      .from("orders")
      .insert({
        user_id,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email?.trim() || null,
        delivery_method,
        delivery_address,
        delivery_provider,
        delivery_city,
        delivery_cost,
        delivery_days,
        payment_method,
        items,
        comment,
        total_amount,
        status: "new",
      })
      .select("*")
      .single();

    if (insErr || !order) {
      return json({ error: insErr?.message ?? "Не удалось создать заказ" }, 500);
    }

    // 2) Если доставка через перевозчика — пытаемся создать заявку
    let deliveryResult: { ok: boolean; external_id?: string; tracking?: string; error?: string } = {
      ok: false,
    };
    if (delivery_provider === "yandex" || delivery_provider === "pek") {
      try {
        const sender = await getSender();
        const r =
          delivery_provider === "yandex"
            ? await createYandexClaim(order, sender)
            : await createPekOrder(order, sender);

        await admin
          .from("orders")
          .update({
            delivery_external_id: r.external_id,
            delivery_tracking: r.tracking,
            delivery_payload: r.raw,
          })
          .eq("id", order.id);

        deliveryResult = { ok: true, external_id: r.external_id, tracking: r.tracking };
      } catch (e: any) {
        // Заказ всё равно создан — заявку перевозчика админ может создать вручную из админки
        console.error("Auto delivery claim failed:", e?.message ?? e);
        deliveryResult = { ok: false, error: e?.message ?? String(e) };
      }
    }

    return json({ data: { order_id: order.id, delivery: deliveryResult } });
  } catch (e: any) {
    console.error("order-place error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
