// Публичный приём заявки с сайта: валидируем, пишем в contact_requests и шлём письмо админу.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { ADMIN_EMAIL, renderContactRequest, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  subject: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(2000),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const { name, phone, email, subject, message } = parsed.data;

  const contact = [phone, email].filter(Boolean).join(" / ") || "—";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error } = await admin
    .from("contact_requests")
    .insert({ name, contact, subject: subject || null, message })
    .select("id")
    .single();

  if (error) {
    console.error("contact_requests insert failed", error);
    return new Response(JSON.stringify({ error: "insert_failed", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Письмо админу — отправляем в фоне с таймаутом, чтобы SMTP-задержки/зависания
  // не блокировали ответ клиенту и не занимали воркер edge-функций.
  if (ADMIN_EMAIL) {
    const t = renderContactRequest({ name, phone, email, subject, message });
    const emailTask = (async () => {
      try {
        await Promise.race([
          sendEmail({
            to: ADMIN_EMAIL,
            subject: t.subject,
            html: t.html,
            template: "contact-request-admin",
            related_request_id: inserted?.id ?? null,
            metadata: { source: "contact-form" },
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("smtp timeout 10s")), 10_000)),
        ]);
      } catch (e) {
        console.error("admin email send failed", e);
      }
    })();
    // @ts-ignore — EdgeRuntime доступен в supabase/edge-runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(emailTask);
    }
  } else {
    console.warn("ADMIN_NOTIFY_EMAIL is not set — admin email skipped");
  }

  return new Response(JSON.stringify({ ok: true, id: inserted?.id ?? null }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
