// Tinkoff Payments (Т-Касса) — init/notification/refund.
// API docs: https://www.tbank.ru/kassa/dev/payments/
//
// Действия:
//  - action=init: клиент вызывает, чтобы получить PaymentURL после оформления заказа.
//  - action=refund: вызывает admin-api (service_role) для возврата.
//  - без action + JSON от Тинькофф: приходит серверный Notification (webhook).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderPaymentConfirmed, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TERMINAL_KEY = Deno.env.get("TINKOFF_TERMINAL_KEY") ?? "";
const PASSWORD = Deno.env.get("TINKOFF_PASSWORD") ?? "";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const TINKOFF_API = "https://securepay.tinkoff.ru/v2";

// На self-hosted SUPABASE_URL внутри edge-runtime = http://kong:8000 (внутренний).
// NotificationURL, который улетает в Т-Кассу, ДОЛЖЕН быть публичным — иначе
// вебхук об оплате никогда не долетит и заказ навсегда останется в NEW.
const PUBLIC_API_URL = (
  Deno.env.get("SUPABASE_PUBLIC_URL") ||
  Deno.env.get("API_EXTERNAL_URL") ||
  SUPABASE_URL
).replace(/\/$/, "");


const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const orderDisplayNumber = (order: any) =>
  order?.order_number || (order?.id ? `DW-${String(order.id).slice(0, 6).toUpperCase()}` : "FAKTURA");

// Токен Тинькофф = SHA256(конкатенация значений всех корневых полей + Password, отсортированных по ключу).
// Массивы и объекты в подсчёте не участвуют.
async function makeToken(params: Record<string, any>): Promise<string> {
  const flat: Record<string, string> = { Password: PASSWORD };
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") continue; // Receipt, DATA и т.п. не входят
    flat[k] = typeof v === "boolean" ? String(v) : String(v);
  }
  const concat = Object.keys(flat).sort().map((k) => flat[k]).join("");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(concat));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callTinkoff(endpoint: string, params: Record<string, any>) {
  const body = { TerminalKey: TERMINAL_KEY, ...params };
  const Token = await makeToken(body);
  const res = await fetch(`${TINKOFF_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, Token }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.Success !== false, status: res.status, data };
}

async function logPayment(row: {
  order_id?: string | null;
  event: string;
  amount?: number | null;
  status?: string | null;
  payment_id?: string | null;
  order_key?: string | null;
  raw_request?: any;
  raw_response?: any;
  error?: string | null;
}) {
  await admin.from("payment_log").insert({
    provider: "tinkoff",
    currency: "RUB",
    ...row,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!TERMINAL_KEY || !PASSWORD) {
      return json({ error: "Tinkoff credentials not configured" }, 500);
    }

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? url.searchParams.get("action") ?? "").trim();

    // ==================== INIT ====================
    if (action === "init") {
      const orderId = String(body?.orderId ?? "").trim();
      if (!orderId) return json({ error: "orderId required" }, 400);

      const { data: order, error: oErr } = await admin
        .from("orders")
        .select("id, total_amount, customer_email, customer_phone, items")
        .eq("id", orderId)
        .maybeSingle();
      if (oErr || !order) return json({ error: "order not found" }, 404);

      const amountKopecks = Math.round(Number(order.total_amount) * 100);
      const origin = req.headers.get("origin") ?? "";

      const initParams: Record<string, any> = {
        Amount: amountKopecks,
        OrderId: order.id,
        Description: `Заказ №${orderDisplayNumber(order)}`,
        SuccessURL: `${origin}/account?payment=success&order=${order.id}`,
        FailURL: `${origin}/account?payment=fail&order=${order.id}`,
        NotificationURL: `${PUBLIC_API_URL}/functions/v1/tinkoff-payment`,
        DATA: order.customer_email ? { Email: order.customer_email } : undefined,
      };

      const r = await callTinkoff("Init", initParams);
      await logPayment({
        order_id: order.id,
        event: "init",
        amount: Number(order.total_amount),
        status: r.data?.Status ?? null,
        payment_id: r.data?.PaymentId ? String(r.data.PaymentId) : null,
        order_key: String(initParams.OrderId),
        raw_request: initParams,
        raw_response: r.data,
        error: r.ok ? null : (r.data?.Message || r.data?.Details || "init failed"),
      });

      if (!r.ok || !r.data?.PaymentURL) {
        return json({ error: r.data?.Message ?? "Tinkoff init failed", details: r.data }, 400);
      }

      // Записываем ссылку/ID платежа на заказ
      await admin
        .from("orders")
        .update({
          payment_id: String(r.data.PaymentId),
          payment_url: r.data.PaymentURL,
          payment_status: r.data.Status ?? "NEW",
        })
        .eq("id", order.id);

      return json({ paymentUrl: r.data.PaymentURL, paymentId: String(r.data.PaymentId) });
    }

    // ==================== REFUND (admin only) ====================
    if (action === "refund") {
      const pass = req.headers.get("x-admin-password") ?? body?.password ?? "";
      if (!ADMIN_PASSWORD || pass !== ADMIN_PASSWORD) return json({ error: "unauthorized" }, 401);

      const paymentId = String(body?.paymentId ?? "").trim();
      const amount = Number(body?.amount ?? 0);
      if (!paymentId) return json({ error: "paymentId required" }, 400);

      const params: Record<string, any> = { PaymentId: paymentId };
      if (amount > 0) params.Amount = Math.round(amount * 100);

      const r = await callTinkoff("Cancel", params);

      // Найдём order по payment_id
      const { data: order } = await admin
        .from("orders")
        .select("id, refunded_amount, total_amount")
        .eq("payment_id", paymentId)
        .maybeSingle();

      await logPayment({
        order_id: order?.id ?? null,
        event: "refund",
        amount: amount > 0 ? amount : (order?.total_amount ? Number(order.total_amount) : null),
        status: r.data?.Status ?? null,
        payment_id: paymentId,
        raw_request: params,
        raw_response: r.data,
        error: r.ok ? null : (r.data?.Message || r.data?.Details || "refund failed"),
      });

      if (!r.ok) return json({ error: r.data?.Message ?? "refund failed", details: r.data }, 400);

      // Обновим заказ
      if (order) {
        const newRefunded = Number(order.refunded_amount ?? 0) + (amount > 0 ? amount : Number(order.total_amount));
        await admin
          .from("orders")
          .update({
            payment_status: r.data?.Status ?? "REFUNDED",
            refunded_amount: newRefunded,
          })
          .eq("id", order.id);
      }

      return json({ ok: true, status: r.data?.Status, data: r.data });
    }

    // ==================== NOTIFICATION (webhook) ====================
    // Тинькофф шлёт JSON: TerminalKey, OrderId, Success, Status, PaymentId, Amount, Token, ...
    if (body?.TerminalKey && body?.Status) {
      // Верификация токена
      const incoming = String(body.Token ?? "");
      const check = { ...body };
      delete check.Token;
      const expected = await makeToken(check);
      const valid = expected === incoming;

      // Найдём заказ по OrderId (это наш order_number или id) или по payment_id
      const orderKey = String(body.OrderId ?? "");
      const paymentId = String(body.PaymentId ?? "");
      let orderRow: { id: string } | null = null;

      if (orderKey) {
        const { data: byId } = await admin.from("orders").select("id").eq("id", orderKey).maybeSingle();
        if (byId) orderRow = byId;
      }
      if (!orderRow && paymentId) {
        const { data } = await admin.from("orders").select("id").eq("payment_id", paymentId).maybeSingle();
        if (data) orderRow = data;
      }

      await logPayment({
        order_id: orderRow?.id ?? null,
        event: "notification",
        amount: body.Amount ? Number(body.Amount) / 100 : null,
        status: body.Status,
        payment_id: paymentId,
        order_key: orderKey,
        raw_request: body,
        raw_response: { tokenValid: valid },
        error: valid ? null : "invalid token",
      });

      if (!valid) return new Response("INVALID_TOKEN", { status: 403 });

      if (orderRow) {
        const patch: Record<string, any> = { payment_status: body.Status };
        // Синхронизируем статус заказа
        if (body.Status === "CONFIRMED" || body.Status === "AUTHORIZED") {
          patch.status = "in_progress";
        } else if (body.Status === "REFUNDED" || body.Status === "REVERSED" || body.Status === "CANCELED") {
          patch.status = "cancelled";
        }
        await admin.from("orders").update(patch).eq("id", orderRow.id);

        // Письмо "оплата получена" — только при первом переходе в CONFIRMED
        if (body.Status === "CONFIRMED") {
          const { data: full } = await admin
            .from("orders")
            .select("*")
            .eq("id", orderRow.id)
            .maybeSingle();
          if (full?.customer_email) {
            const t = renderPaymentConfirmed(full);
            await sendEmail({
              to: full.customer_email,
              subject: t.subject,
              html: t.html,
              template: "payment-confirmed",
              related_order_id: full.id,
            }).catch((e) => console.error("payment email failed", e));
          }
        }
      }

      // Тинькофф ждёт ответ "OK" (plain text)
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("tinkoff-payment error", err);
    await logPayment({ event: "error", error: err?.message ?? "internal error", raw_response: { stack: err?.stack } });
    return json({ error: err?.message ?? "internal error" }, 500);
  }
});
