// Общий отправитель писем через SMTP (Timeweb Mail).
// Используется во всех edge-функциях, где надо шлём транзакционные письма клиенту/админу.
// Дизайн — FAKTURA: чёрный фон, золотые/деревянные акценты, крупная типографика.

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_SENDER_NAME = Deno.env.get("SMTP_SENDER_NAME") ?? "FAKTURA";
const SMTP_FROM = Deno.env.get("SMTP_ADMIN_EMAIL") ?? SMTP_USER;
const ADMIN_NOTIFY_EMAIL =
  Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? Deno.env.get("SMTP_ADMIN_EMAIL") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://faktura-wood.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const ADMIN_EMAIL = ADMIN_NOTIFY_EMAIL;

type LogRow = {
  recipient: string;
  subject: string;
  template?: string;
  status?: string;
  error?: string | null;
  related_order_id?: string | null;
  related_request_id?: string | null;
  metadata?: Record<string, unknown>;
};

async function logEmail(row: LogRow) {
  try {
    await admin.from("email_log").insert({
      recipient: row.recipient,
      subject: row.subject,
      template: row.template ?? null,
      status: row.status ?? "sent",
      error: row.error ?? null,
      related_order_id: row.related_order_id ?? null,
      related_request_id: row.related_request_id ?? null,
      metadata: row.metadata ?? {},
    });
  } catch (e) {
    console.error("email_log insert failed", e);
  }
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  template?: string;
  related_order_id?: string | null;
  related_request_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const recipients = Array.isArray(opts.to) ? opts.to.filter(Boolean) : [opts.to].filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: "no recipient" };

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const err = "SMTP не настроен (SMTP_HOST/USER/PASS)";
    console.error(err);
    for (const to of recipients) {
      await logEmail({ ...opts, to: undefined as any, recipient: to, status: "failed", error: err });
    }
    return { ok: false, error: err };
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    for (const to of recipients) {
      try {
        await client.send({
          from: `${SMTP_SENDER_NAME} <${SMTP_FROM}>`,
          to,
          subject: opts.subject,
          content: opts.text ?? "Откройте письмо в HTML-совместимом клиенте.",
          html: opts.html,
        });
        await logEmail({ ...opts, recipient: to, status: "sent" });
      } catch (e: any) {
        console.error("SMTP send failed", to, e?.message ?? e);
        await logEmail({
          ...opts,
          recipient: to,
          status: "failed",
          error: e?.message ?? String(e),
        });
      }
    }
    return { ok: true };
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

// =============== ШАБЛОНЫ ===============

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })
    .format(Number(n) || 0);

function layout(opts: { title: string; preheader?: string; bodyHtml: string; footerCta?: string }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Arial,sans-serif;color:#e8e4dc;">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(opts.preheader ?? opts.title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#0b0b0b 0%,#141110 100%);border:1px solid #2a221a;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:32px 32px 16px 32px;text-align:center;border-bottom:1px solid #2a221a;">
        <div style="font-family:'Franklin Gothic Medium','Arial Narrow',Arial,sans-serif;font-size:28px;letter-spacing:8px;color:#c9a96a;font-weight:600;">F A K T U R A</div>
        <div style="font-size:11px;letter-spacing:3px;color:#8a7a5c;margin-top:6px;text-transform:uppercase;">Wood · Design · Craft</div>
      </td></tr>
      <tr><td style="padding:32px;color:#e8e4dc;font-size:15px;line-height:1.6;">
        ${opts.bodyHtml}
        ${opts.footerCta ?? ""}
      </td></tr>
      <tr><td style="padding:24px 32px;border-top:1px solid #2a221a;text-align:center;font-size:12px;color:#6b5f4a;">
        <div>© FAKTURA · <a href="${SITE_URL}" style="color:#c9a96a;text-decoration:none;">faktura-wood.com</a></div>
        <div style="margin-top:6px;">Это письмо отправлено автоматически, отвечать на него не нужно.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function itemsTable(items: any[]) {
  const rows = (items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a221a;color:#e8e4dc;">
          <div style="font-weight:600;">${escapeHtml(i.name ?? "Товар")}</div>
          ${i.sku ? `<div style="font-size:12px;color:#8a7a5c;margin-top:2px;">Артикул: ${escapeHtml(i.sku)}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #2a221a;text-align:center;color:#c9a96a;white-space:nowrap;">×${escapeHtml(i.quantity ?? 1)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a221a;text-align:right;color:#e8e4dc;white-space:nowrap;">${escapeHtml(money(Number(i.price ?? 0) * Number(i.quantity ?? 1)))}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">${rows}</table>`;
}

function summary(order: any) {
  const deliveryLabel =
    order.delivery_provider === "pickup" || order.delivery_method === "pickup" || order.delivery_method === "Самовывоз"
      ? "Самовывоз"
      : order.delivery_provider === "yandex"
        ? "Яндекс.Доставка"
        : order.delivery_provider === "pek"
          ? "ПЭК"
          : order.delivery_provider === "cdek"
            ? "СДЭК"
            : "Доставка";
  const paymentRaw = String(order.payment_method ?? "").toLowerCase();
  const paymentLabel =
    paymentRaw === "online" || paymentRaw.includes("банк") || paymentRaw.includes("сбп") || paymentRaw.includes("тинькофф") || paymentRaw.includes("т-касс")
      ? "Онлайн-оплата (Т-Касса)"
      : "При получении";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;font-size:14px;">
      <tr><td style="padding:6px 0;color:#8a7a5c;">Способ доставки</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(deliveryLabel)}</td></tr>
      ${order.delivery_address ? `<tr><td style="padding:6px 0;color:#8a7a5c;">Адрес</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(order.delivery_address)}</td></tr>` : ""}
      ${order.delivery_cost ? `<tr><td style="padding:6px 0;color:#8a7a5c;">Стоимость доставки</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(money(order.delivery_cost))}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#8a7a5c;">Оплата</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(paymentLabel)}</td></tr>
      <tr><td style="padding:14px 0 0 0;color:#c9a96a;font-size:16px;font-weight:600;">Итого</td><td style="padding:14px 0 0 0;text-align:right;color:#c9a96a;font-size:20px;font-weight:700;">${escapeHtml(money(order.total_amount))}</td></tr>
    </table>`;
}

export function renderOrderConfirmation(order: any) {
  const num = order.order_number ?? (order.id ? `DW-${String(order.id).slice(0, 6).toUpperCase()}` : "");
  const isOnlinePayment = String(order.payment_method ?? "").toLowerCase() === "online";
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:'Franklin Gothic Medium',Arial,sans-serif;font-size:26px;color:#c9a96a;font-weight:600;letter-spacing:1px;">Заказ №${escapeHtml(num)} создан</h1>
    <p style="margin:0 0 20px 0;color:#8a7a5c;">${
      isOnlinePayment
        ? "Чтобы передать заказ в работу, завершите оплату на странице Т-Кассы. Если оплата не открылась, напишите нам — пришлём ссылку повторно."
        : "Мы получили заказ и свяжемся с вами для подтверждения деталей."
    }</p>
    ${itemsTable(order.items ?? [])}
    ${summary(order)}
    ${order.comment ? `<div style="margin-top:20px;padding:14px 16px;background:#0a0908;border:1px solid #2a221a;border-radius:10px;font-size:13px;color:#8a7a5c;"><strong style="color:#c9a96a;">Комментарий:</strong> ${escapeHtml(order.comment)}</div>` : ""}`;
  const cta = `
    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE_URL}/account" style="display:inline-block;padding:14px 32px;background:linear-gradient(180deg,#c9a96a 0%,#a3854a 100%);color:#0b0b0b;text-decoration:none;border-radius:10px;font-weight:600;letter-spacing:1px;font-size:14px;text-transform:uppercase;">Мой заказ</a>
    </div>`;
  return {
    subject: `FAKTURA · Заказ №${num} принят`,
    html: layout({
      title: `Заказ №${num} принят`,
      preheader: `Спасибо за заказ! Итого ${money(order.total_amount)}`,
      bodyHtml: body,
      footerCta: cta,
    }),
  };
}

export function renderPaymentConfirmed(order: any) {
  const num = order.order_number ?? (order.id ? `DW-${String(order.id).slice(0, 6).toUpperCase()}` : "");
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:'Franklin Gothic Medium',Arial,sans-serif;font-size:26px;color:#c9a96a;font-weight:600;letter-spacing:1px;">Оплата получена</h1>
    <p style="margin:0 0 20px 0;color:#8a7a5c;">По заказу №${escapeHtml(num)} прошла оплата на сумму ${escapeHtml(money(order.total_amount))}. Мы приступаем к сборке и отправке.</p>
    ${itemsTable(order.items ?? [])}
    ${summary(order)}`;
  const cta = `
    <div style="margin-top:28px;text-align:center;">
      <a href="${SITE_URL}/account" style="display:inline-block;padding:14px 32px;background:linear-gradient(180deg,#c9a96a 0%,#a3854a 100%);color:#0b0b0b;text-decoration:none;border-radius:10px;font-weight:600;letter-spacing:1px;font-size:14px;text-transform:uppercase;">Отследить заказ</a>
    </div>`;
  return {
    subject: `FAKTURA · Оплата по заказу №${num} получена`,
    html: layout({
      title: `Оплата по заказу №${num} получена`,
      preheader: `Оплата ${money(order.total_amount)} получена`,
      bodyHtml: body,
      footerCta: cta,
    }),
  };
}

export function renderAdminNewOrder(order: any) {
  const num = order.order_number ?? (order.id ? `DW-${String(order.id).slice(0, 6).toUpperCase()}` : "");
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:'Franklin Gothic Medium',Arial,sans-serif;font-size:24px;color:#c9a96a;font-weight:600;">Новый заказ №${escapeHtml(num)}</h1>
    <p style="margin:0 0 20px 0;color:#8a7a5c;">${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}${order.customer_email ? " · " + escapeHtml(order.customer_email) : ""}</p>
    ${itemsTable(order.items ?? [])}
    ${summary(order)}`;
  const cta = `
    <div style="margin-top:24px;text-align:center;">
      <a href="${SITE_URL}/admin" style="display:inline-block;padding:12px 28px;background:#c9a96a;color:#0b0b0b;text-decoration:none;border-radius:10px;font-weight:600;letter-spacing:1px;font-size:13px;text-transform:uppercase;">Открыть в админке</a>
    </div>`;
  return {
    subject: `[FAKTURA] Новый заказ №${num} · ${money(order.total_amount)}`,
    html: layout({
      title: `Новый заказ №${num}`,
      preheader: `${order.customer_name} · ${money(order.total_amount)}`,
      bodyHtml: body,
      footerCta: cta,
    }),
  };
}

export function renderContactRequest(req: {
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  subject?: string;
}) {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:'Franklin Gothic Medium',Arial,sans-serif;font-size:24px;color:#c9a96a;font-weight:600;">Новая заявка с сайта</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;font-size:14px;">
      <tr><td style="padding:6px 0;color:#8a7a5c;">Имя</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(req.name)}</td></tr>
      ${req.phone ? `<tr><td style="padding:6px 0;color:#8a7a5c;">Телефон</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(req.phone)}</td></tr>` : ""}
      ${req.email ? `<tr><td style="padding:6px 0;color:#8a7a5c;">Email</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(req.email)}</td></tr>` : ""}
      ${req.subject ? `<tr><td style="padding:6px 0;color:#8a7a5c;">Тема</td><td style="padding:6px 0;text-align:right;color:#e8e4dc;">${escapeHtml(req.subject)}</td></tr>` : ""}
    </table>
    ${req.message ? `<div style="margin-top:20px;padding:16px;background:#0a0908;border:1px solid #2a221a;border-radius:10px;color:#e8e4dc;white-space:pre-wrap;">${escapeHtml(req.message)}</div>` : ""}`;
  return {
    subject: `[FAKTURA] Заявка · ${req.name}`,
    html: layout({
      title: "Новая заявка с сайта",
      preheader: `${req.name}${req.phone ? " · " + req.phone : ""}`,
      bodyHtml: body,
    }),
  };
}
