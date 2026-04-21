// Admin API: единая edge-функция для всех админских операций.
// Авторизация: на каждый запрос клиент шлёт заголовок X-Admin-Password,
// который сверяется с секретом ADMIN_PASSWORD. Если совпало —
// функция использует SERVICE_ROLE и обходит RLS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Простое constant-time сравнение
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const password = req.headers.get("x-admin-password") ?? body?.password ?? "";

    if (!ADMIN_PASSWORD) {
      return json({ error: "Admin password is not configured on the server" }, 500);
    }

    // Логин — отдельная ветка без авторизации внутри
    if (action === "login") {
      const ok = typeof password === "string" && safeEqual(password, ADMIN_PASSWORD);
      return json({ ok }, ok ? 200 : 401);
    }

    // Все остальные действия — требуют пароль
    if (!safeEqual(String(password), ADMIN_PASSWORD)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const payload = body?.payload ?? {};

    switch (action) {
      // ===== PRODUCTS =====
      case "products.list": {
        const { data, error } = await admin
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case "products.create": {
        const { data, error } = await admin.from("products").insert(payload).select().single();
        if (error) throw error;
        return json({ data });
      }
      case "products.update": {
        const { id, ...patch } = payload;
        const { data, error } = await admin
          .from("products")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "products.delete": {
        const { error } = await admin.from("products").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== ORDERS =====
      case "orders.list": {
        const { data, error } = await admin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case "orders.updateStatus": {
        const { data, error } = await admin
          .from("orders")
          .update({ status: payload.status })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "orders.delete": {
        const { error } = await admin.from("orders").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== CONTACT REQUESTS =====
      case "requests.list": {
        const { data, error } = await admin
          .from("contact_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case "requests.markRead": {
        const { data, error } = await admin
          .from("contact_requests")
          .update({ is_read: payload.is_read ?? true })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "requests.delete": {
        const { error } = await admin.from("contact_requests").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== VACANCIES =====
      case "vacancies.list": {
        const { data, error } = await admin
          .from("vacancies")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json({ data });
      }
      case "vacancies.create": {
        const { data, error } = await admin.from("vacancies").insert(payload).select().single();
        if (error) throw error;
        return json({ data });
      }
      case "vacancies.update": {
        const { id, ...patch } = payload;
        const { data, error } = await admin
          .from("vacancies")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "vacancies.delete": {
        const { error } = await admin.from("vacancies").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== BLOG =====
      case "blog.list": {
        const { data, error } = await admin
          .from("blog_posts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case "blog.create": {
        const { data, error } = await admin.from("blog_posts").insert(payload).select().single();
        if (error) throw error;
        return json({ data });
      }
      case "blog.update": {
        const { id, ...patch } = payload;
        const { data, error } = await admin
          .from("blog_posts")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "blog.delete": {
        const { error } = await admin.from("blog_posts").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== STORAGE: upload (data URL → bucket) =====
      case "storage.upload": {
        // payload: { bucket, path, dataUrl, contentType }
        const { bucket, path, dataUrl, contentType } = payload;
        const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl ?? "");
        if (!match) return json({ error: "Invalid dataUrl" }, 400);
        const mime = contentType || match[1];
        const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
        const { error } = await admin.storage
          .from(bucket)
          .upload(path, bytes, { contentType: mime, upsert: true });
        if (error) throw error;
        const { data: pub } = admin.storage.from(bucket).getPublicUrl(path);
        return json({ data: { url: pub.publicUrl } });
      }

      // ===== DASHBOARD STATS =====
      case "stats": {
        const [orders, requests] = await Promise.all([
          admin.from("orders").select("id, status", { count: "exact" }),
          admin.from("contact_requests").select("id, is_read", { count: "exact" }),
        ]);
        const newOrders = (orders.data ?? []).filter((o: any) => o.status === "new").length;
        const unreadRequests = (requests.data ?? []).filter((r: any) => !r.is_read).length;
        return json({
          data: {
            ordersTotal: orders.count ?? 0,
            ordersNew: newOrders,
            requestsTotal: requests.count ?? 0,
            requestsUnread: unreadRequests,
          },
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("admin-api error", err);
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});
