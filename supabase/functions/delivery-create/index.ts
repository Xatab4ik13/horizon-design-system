// Создание заявки у перевозчика. Вызывается из admin-api (с проверкой пароля)
// или внутренним вызовом. Сейчас защищено заголовком X-Admin-Password.
// Вход: { provider: 'yandex'|'pek', orderId: uuid }
// Берёт заказ из БД, отправляет в перевозчика, сохраняет external_id и tracking.

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
    .from("app_settings")
    .select("value")
    .eq("key", "sender")
    .maybeSingle();
  return (data?.value ?? {}) as Record<string, any>;
}

async function createYandexClaim(order: any, sender: Record<string, any>) {
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
        address: {
          fullname: order.delivery_address || order.delivery_city || "",
        },
        contact: {
          name: order.customer_name,
          phone: order.customer_phone,
        },
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
  return {
    external_id: j.id ?? requestId,
    tracking: j.id ?? "",
    raw: j,
  };
}

async function createPekOrder(order: any, sender: Record<string, any>) {
  // Минимальный заказ ПЭК (упрощённый, для теста)
  const auth = btoa(`${PEK_LOGIN}:${PEK_KEY}`);
  const totalWeight = (order.items as any[]).reduce(
    (s: number, i: any) => s + (i.weight ? Number(String(i.weight).replace(/[^0-9.]/g, "")) || 1 : 1) * (i.quantity ?? 1),
    0,
  );
  const body = {
    senderCityId: sender.pek_city_id || "",
    receiverCityName: order.delivery_city || order.delivery_address || "",
    receiverContactName: order.customer_name,
    receiverPhone: order.customer_phone,
    cargo: {
      weight: Math.max(0.5, totalWeight),
      places: order.items.length,
    },
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
    const password = req.headers.get("x-admin-password") ?? "";
    if (!ADMIN_PASSWORD || !safeEqual(password, ADMIN_PASSWORD)) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { provider, orderId } = await req.json();
    if (!["yandex", "pek"].includes(provider)) {
      return json({ error: "Unknown provider" }, 400);
    }
    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (oErr || !order) return json({ error: "Order not found" }, 404);

    const sender = await getSender();
    const result =
      provider === "yandex"
        ? await createYandexClaim(order, sender)
        : await createPekOrder(order, sender);

    await admin
      .from("orders")
      .update({
        delivery_provider: provider,
        delivery_external_id: result.external_id,
        delivery_tracking: result.tracking,
        delivery_payload: result.raw,
      })
      .eq("id", orderId);

    return json({ data: result });
  } catch (e: any) {
    console.error("delivery-create error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
