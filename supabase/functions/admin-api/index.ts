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
const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") ?? "").trim().toLowerCase();

// На self-hosted SUPABASE_URL внутри edge-runtime = http://kong:8000 (внутренний адрес).
// Публичные ссылки, которые уходят в браузер и в БД, ДОЛЖНЫ строиться от внешнего URL —
// иначе <img src> получает http://kong:8000/... и отображается чёрным квадратом.
const PUBLIC_STORAGE_URL = (
  Deno.env.get("SUPABASE_PUBLIC_URL") ||
  Deno.env.get("API_EXTERNAL_URL") ||
  SUPABASE_URL
).replace(/\/$/, "");

const buildPublicUrl = (bucket: string, path: string) =>
  `${PUBLIC_STORAGE_URL}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

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

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Получить текущий пароль: сначала из БД (app_settings.admin_password_hash), иначе env.
// Возвращает { hash, source } где source = 'db' | 'env'.
async function getActivePasswordHash(): Promise<{ hash: string; source: "db" | "env" }> {
  const { data } = await admin.from("app_settings").select("value").eq("key", "admin_password_hash").maybeSingle();
  const v = (data?.value as { hash?: string } | null) ?? null;
  if (v?.hash) return { hash: v.hash, source: "db" };
  return { hash: await sha256Hex(ADMIN_PASSWORD), source: "env" };
}

async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const { hash } = await getActivePasswordHash();
  const incoming = await sha256Hex(password);
  return safeEqual(incoming, hash);
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
      const email = String(body?.email ?? "").trim().toLowerCase();
      // Если на сервере задан ADMIN_EMAIL — требуем совпадение
      if (ADMIN_EMAIL && email !== ADMIN_EMAIL) {
        return json({ ok: false, error: "Неверный email или пароль" }, 401);
      }
      const ok = await verifyPassword(String(password));
      return json({ ok }, ok ? 200 : 401);
    }

    // Сброс пароля по env (для случая «забыл пароль»). Принимает env-пароль.
    if (action === "auth.resetWithEnv") {
      const envOk = typeof password === "string" && safeEqual(password, ADMIN_PASSWORD);
      if (!envOk) return json({ error: "Неверный мастер-пароль (из настроек сервера)" }, 401);
      await admin.from("app_settings").delete().eq("key", "admin_password_hash");
      return json({ ok: true });
    }

    // Все остальные действия — требуют пароль
    if (!(await verifyPassword(String(password)))) {
      return json({ error: "Unauthorized" }, 401);
    }

    const payload = body?.payload ?? {};
    console.log(`[admin-api] action=${action} payload_size=${JSON.stringify(payload).length}`);

    switch (action) {
      // ===== AUTH =====
      case "auth.changePassword": {
        const { currentPassword, newPassword } = payload ?? {};
        if (typeof newPassword !== "string" || newPassword.length < 6) {
          return json({ error: "Новый пароль должен быть не короче 6 символов" }, 400);
        }
        if (!(await verifyPassword(String(currentPassword ?? "")))) {
          return json({ error: "Текущий пароль неверный" }, 401);
        }
        const hash = await sha256Hex(newPassword);
        const { error } = await admin
          .from("app_settings")
          .upsert({ key: "admin_password_hash", value: { hash } }, { onConflict: "key" });
        if (error) throw error;
        return json({ ok: true });
      }

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
      // Массовый импорт из 1С: upsert по sku. Если sku отсутствует — создаём как новый.
      case "products.bulkUpsert": {
        const items = Array.isArray(payload?.items) ? payload.items : [];
        let created = 0;
        let updated = 0;
        const errors: string[] = [];
        for (const item of items) {
          try {
            const sku = item?.sku ? String(item.sku).trim() : null;
            if (sku) {
              const { data: existing, error: selErr } = await admin
                .from("products")
                .select("id")
                .eq("sku", sku)
                .maybeSingle();
              if (selErr) throw selErr;
              if (existing?.id) {
                // На апдейте не затираем уже загруженные изображения, если в импорте их нет
                const updatePatch = { ...item };
                if (!Array.isArray(updatePatch.images) || updatePatch.images.length === 0) {
                  delete updatePatch.images;
                } else {
                  // Если в импорте есть фото — добавляем к существующим без дублей
                  const { data: cur } = await admin
                    .from("products")
                    .select("images")
                    .eq("id", existing.id)
                    .maybeSingle();
                  const prev: string[] = Array.isArray(cur?.images) ? cur!.images : [];
                  const merged = Array.from(new Set([...prev, ...updatePatch.images]));
                  updatePatch.images = merged;
                }
                const { error: upErr } = await admin
                  .from("products")
                  .update(updatePatch)
                  .eq("id", existing.id);
                if (upErr) throw upErr;
                updated++;
                continue;
              }
            }
            // При создании нового товара images может отсутствовать — это нормально
            const insertItem = { ...item };
            if (!Array.isArray(insertItem.images)) insertItem.images = [];
            const { error: insErr } = await admin.from("products").insert(insertItem);
            if (insErr) throw insErr;
            created++;
          } catch (e: any) {
            errors.push(`${item?.name ?? item?.sku ?? "?"}: ${e?.message ?? e}`);
          }
        }
        return json({ data: { created, updated, errors } });
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

      // ===== GALLERY =====
      case "gallery.list": {
        const { data, error } = await admin
          .from("gallery_items")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case "gallery.create": {
        const { data, error } = await admin.from("gallery_items").insert(payload).select().single();
        if (error) throw error;
        return json({ data });
      }
      case "gallery.update": {
        const { id, ...patch } = payload;
        const { data, error } = await admin
          .from("gallery_items")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "gallery.delete": {
        const { error } = await admin.from("gallery_items").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "gallery.reorder": {
        const items: { id: string; sort_order: number }[] = Array.isArray(payload?.items) ? payload.items : [];
        for (const it of items) {
          const { error } = await admin
            .from("gallery_items")
            .update({ sort_order: it.sort_order })
            .eq("id", it.id);
          if (error) throw error;
        }
        return json({ ok: true, count: items.length });
      }

      // ===== CATEGORIES (product_categories) =====
      case "categories.list": {
        const { data, error } = await admin
          .from("product_categories")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });
        if (error) throw error;
        return json({ data });
      }
      case "categories.create": {
        const { data, error } = await admin.from("product_categories").insert(payload).select().single();
        if (error) throw error;
        return json({ data });
      }
      case "categories.update": {
        const { id, ...patch } = payload;
        const { data, error } = await admin
          .from("product_categories")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }
      case "categories.delete": {
        const { error } = await admin.from("product_categories").delete().eq("id", payload.id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "categories.reorder": {
        const items: { id: string; sort_order: number }[] = Array.isArray(payload?.items) ? payload.items : [];
        for (const it of items) {
          const { error } = await admin
            .from("product_categories")
            .update({ sort_order: it.sort_order })
            .eq("id", it.id);
          if (error) throw error;
        }
        return json({ ok: true, count: items.length });
      }



      // ===== STORAGE: signed upload URL (для больших файлов, минуя 6МБ-лимит invoke) =====
      case "storage.signUpload": {
        const { bucket, path } = payload;
        if (!bucket || !path) return json({ error: "bucket/path required" }, 400);
        const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
        if (error) throw error;
        return json({ data: { token: data.token, path: data.path, publicUrl: buildPublicUrl(bucket, path) } });
      }



      // ===== STORAGE: upload (data URL → bucket) — оставлен для мелких файлов =====
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
        return json({ data: { url: buildPublicUrl(bucket, path) } });

      }

      // ===== STORAGE: список файлов в бакете (для медиа-библиотеки) =====
      case "storage.list": {
        const bucket = String(payload?.bucket ?? "");
        const prefix = String(payload?.prefix ?? "");
        const limit = Math.min(Number(payload?.limit ?? 500), 1000);
        if (!bucket) return json({ error: "bucket required" }, 400);
        const { data, error } = await admin.storage.from(bucket).list(prefix, {
          limit,
          sortBy: { column: "created_at", order: "desc" },
        });
        if (error) throw error;
        // Отфильтровываем placeholder-папки (у них id === null) и складываем публичные URL
        const files = (data ?? [])
          .filter((f: any) => f && f.id)
          .map((f: any) => {
            const path = prefix ? `${prefix.replace(/\/$/, "")}/${f.name}` : f.name;
            return {
              name: f.name,
              path,
              size: f.metadata?.size ?? null,
              mimeType: f.metadata?.mimetype ?? null,
              createdAt: f.created_at ?? null,
              updatedAt: f.updated_at ?? null,
              publicUrl: buildPublicUrl(bucket, path),
            };
          });

        return json({ data: files });
      }

      // ===== STORAGE: удаление файла =====
      case "storage.delete": {
        const bucket = String(payload?.bucket ?? "");
        const paths: string[] = Array.isArray(payload?.paths)
          ? payload.paths.map((p: any) => String(p))
          : payload?.path
            ? [String(payload.path)]
            : [];
        if (!bucket || !paths.length) return json({ error: "bucket/paths required" }, 400);
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) throw error;
        return json({ ok: true, removed: paths.length });
      }

      // ===== APP SETTINGS (sender etc.) =====
      case "settings.get": {
        const key = String(payload?.key ?? "");
        const { data, error } = await admin
          .from("app_settings")
          .select("value")
          .eq("key", key)
          .maybeSingle();
        if (error) throw error;
        return json({ data: data?.value ?? {} });
      }
      case "settings.getMulti": {
        const keys = Array.isArray(payload?.keys)
          ? payload.keys.map((k: any) => String(k)).filter(Boolean)
          : [];
        if (!keys.length) return json({ data: {} });
        const { data, error } = await admin
          .from("app_settings")
          .select("key, value")
          .in("key", keys);
        if (error) throw error;
        const out: Record<string, unknown> = {};
        for (const k of keys) out[k] = {};
        for (const row of data ?? []) out[row.key] = row.value ?? {};
        return json({ data: out });
      }
      case "settings.set": {
        const key = String(payload?.key ?? "");
        const value = payload?.value ?? {};
        const { error } = await admin
          .from("app_settings")
          .upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) throw error;
        return json({ ok: true });
      }

      // ===== DELIVERY: create claim at carrier =====
      case "delivery.create": {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/delivery-create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": ADMIN_PASSWORD,
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({ provider: payload?.provider, orderId: payload?.orderId }),
        });
        const j = await r.json();
        if (!r.ok) return json({ error: j?.error ?? "delivery-create failed" }, r.status);
        return json(j);
      }

      // ===== DELIVERY: diagnose carriers (auth + city lookup) =====
      case "delivery.diagnose": {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/delivery-diagnose`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": ADMIN_PASSWORD,
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: "{}",
        });
        const j = await r.json();
        if (!r.ok) return json({ error: j?.error ?? "delivery-diagnose failed" }, r.status);
        return json(j);
      }


      // ===== DASHBOARD STATS =====
      case "stats": {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const start7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
        const start30 = new Date(now.getTime() - 30 * 86400_000).toISOString();

        const [ordersRes, requestsRes, productsRes, emailsRes] = await Promise.all([
          admin.from("orders").select("id, status, total_amount, created_at, delivery_method, payment_method"),
          admin.from("contact_requests").select("id, is_read, created_at"),
          admin.from("products").select("id, is_active"),
          admin.from("email_log").select("id, status, created_at"),
        ]);

        const orders = ordersRes.data ?? [];
        const requests = requestsRes.data ?? [];
        const products = productsRes.data ?? [];
        const emails = emailsRes.data ?? [];

        const nonCancelled = (o: any) => o.status !== "cancelled";
        const revenue = (arr: any[]) =>
          arr.filter(nonCancelled).reduce((s, o: any) => s + Number(o.total_amount ?? 0), 0);

        const inRange = (arr: any[], from: string) => arr.filter((x) => x.created_at >= from);

        // Разбивка по статусам
        const byStatus: Record<string, number> = {};
        for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

        // Разбивка по способам доставки
        const byDelivery: Record<string, number> = {};
        for (const o of orders) if (o.delivery_method) byDelivery[o.delivery_method] = (byDelivery[o.delivery_method] ?? 0) + 1;

        // Кол-во пользователей
        let usersTotal = 0;
        try {
          const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
          usersTotal = (data as any)?.total ?? 0;
        } catch { /* игнор */ }

        return json({
          data: {
            ordersTotal: orders.length,
            ordersNew: orders.filter((o: any) => o.status === "new").length,
            ordersToday: inRange(orders, startOfDay).length,
            orders7d: inRange(orders, start7).length,
            orders30d: inRange(orders, start30).length,
            revenueTotal: revenue(orders),
            revenueToday: revenue(inRange(orders, startOfDay)),
            revenue7d: revenue(inRange(orders, start7)),
            revenue30d: revenue(inRange(orders, start30)),
            byStatus,
            byDelivery,
            requestsTotal: requests.length,
            requestsUnread: requests.filter((r: any) => !r.is_read).length,
            requestsToday: inRange(requests, startOfDay).length,
            requests7d: inRange(requests, start7).length,
            productsTotal: products.length,
            productsActive: products.filter((p: any) => p.is_active).length,
            usersTotal,
            emailsTotal: emails.length,
            emailsFailed: emails.filter((e: any) => e.status === "failed" || e.status === "bounced").length,
            emails7d: inRange(emails, start7).length,
          },
        });
      }


      // ===== USERS =====
      // Список зарегистрированных пользователей + агрегаты по заказам.
      // payload: { page?: number, perPage?: number, search?: string }
      case "users.list": {
        const page = Math.max(1, Number(payload?.page ?? 1) | 0);
        const perPage = Math.min(200, Math.max(1, Number(payload?.perPage ?? 50) | 0));
        const search = String(payload?.search ?? "").trim().toLowerCase();

        // auth.admin.listUsers страничкует по 50 сам; чтобы искать по всем полям,
        // сначала тянем всех, фильтруем/страничкуем на нашей стороне.
        const all: any[] = [];
        let p = 1;
        // страховка: не более 20 страниц (1000 пользователей)
        while (p <= 20) {
          const { data, error } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
          if (error) throw error;
          const users = data?.users ?? [];
          all.push(...users);
          if (users.length < 200) break;
          p++;
        }

        // profiles
        const ids = all.map((u) => u.id);
        const { data: profiles } = ids.length
          ? await admin.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", ids)
          : { data: [] as any[] };
        const profileMap = new Map<string, any>();
        for (const pr of profiles ?? []) profileMap.set(pr.user_id, pr);

        // orders aggregates
        const { data: orderRows } = ids.length
          ? await admin.from("orders").select("user_id, total_amount, customer_email, customer_phone").in("user_id", ids)
          : { data: [] as any[] };
        const orderAgg = new Map<string, { count: number; sum: number }>();
        for (const o of orderRows ?? []) {
          const uid = o.user_id as string;
          if (!uid) continue;
          const cur = orderAgg.get(uid) ?? { count: 0, sum: 0 };
          cur.count += 1;
          cur.sum += Number(o.total_amount ?? 0);
          orderAgg.set(uid, cur);
        }

        let merged = all.map((u) => {
          const pr = profileMap.get(u.id) ?? {};
          const ag = orderAgg.get(u.id) ?? { count: 0, sum: 0 };
          const first = pr.first_name ?? u.user_metadata?.first_name ?? "";
          const last = pr.last_name ?? u.user_metadata?.last_name ?? "";
          const phone = pr.phone ?? u.user_metadata?.phone ?? u.phone ?? "";
          return {
            id: u.id,
            email: u.email ?? "",
            phone,
            firstName: first,
            lastName: last,
            fullName: `${first} ${last}`.trim(),
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at,
            emailConfirmed: !!u.email_confirmed_at,
            ordersCount: ag.count,
            ordersSum: ag.sum,
            provider: u.app_metadata?.provider ?? "email",
          };
        });

        if (search) {
          merged = merged.filter((u) =>
            u.email.toLowerCase().includes(search) ||
            u.fullName.toLowerCase().includes(search) ||
            String(u.phone).toLowerCase().includes(search)
          );
        }

        merged.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

        const total = merged.length;
        const start = (page - 1) * perPage;
        const items = merged.slice(start, start + perPage);
        return json({ data: { items, total, page, perPage } });
      }

      // Один пользователь + его заказы + заявки по email/phone.
      case "users.get": {
        const id = String(payload?.id ?? "");
        if (!id) return json({ error: "id required" }, 400);
        const { data: u, error } = await admin.auth.admin.getUserById(id);
        if (error) throw error;
        const user = u?.user;
        if (!user) return json({ error: "User not found" }, 404);

        const { data: pr } = await admin
          .from("profiles").select("first_name, last_name, phone").eq("user_id", id).maybeSingle();

        const { data: orders } = await admin
          .from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false });

        // связанные заявки: по email или телефону (если есть)
        const email = user.email ?? "";
        const phone = pr?.phone ?? user.user_metadata?.phone ?? user.phone ?? "";
        let requests: any[] = [];
        if (email || phone) {
          const orClauses: string[] = [];
          if (email) orClauses.push(`contact.ilike.%${email}%`);
          if (phone) orClauses.push(`contact.ilike.%${phone}%`);
          const { data: reqRows } = await admin
            .from("contact_requests")
            .select("*")
            .or(orClauses.join(","))
            .order("created_at", { ascending: false });
          requests = reqRows ?? [];
        }

        return json({
          data: {
            user: {
              id: user.id,
              email,
              phone,
              firstName: pr?.first_name ?? user.user_metadata?.first_name ?? "",
              lastName: pr?.last_name ?? user.user_metadata?.last_name ?? "",
              createdAt: user.created_at,
              lastSignInAt: user.last_sign_in_at,
              emailConfirmed: !!user.email_confirmed_at,
              provider: user.app_metadata?.provider ?? "email",
            },
            orders: orders ?? [],
            requests,
          },
        });
      }

      // Отправить ссылку восстановления пароля (magic link для сброса).
      case "users.sendPasswordReset": {
        const email = String(payload?.email ?? "").trim();
        if (!email) return json({ error: "email required" }, 400);
        const { error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
        });
        if (error) throw error;
        return json({ ok: true });
      }

      // Удалить пользователя (auth.users + каскадом profiles). Заказы остаются (user_id обнулится).
      case "users.delete": {
        const id = String(payload?.id ?? "");
        if (!id) return json({ error: "id required" }, 400);
        // Отвязываем заказы, чтобы не терять историю
        await admin.from("orders").update({ user_id: null }).eq("user_id", id);
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
        return json({ ok: true });
      }

      // ==================== ЖУРНАЛ EMAIL ====================

      // Список записей журнала с фильтрами.
      case "emails.list": {
        const search = String(payload?.search ?? "").trim().toLowerCase();
        const status = String(payload?.status ?? "").trim();
        const template = String(payload?.template ?? "").trim();
        const dateFrom = String(payload?.dateFrom ?? "").trim();
        const dateTo = String(payload?.dateTo ?? "").trim();
        const limit = Math.min(Math.max(Number(payload?.limit ?? 500), 1), 2000);

        let q = admin.from("email_log").select("*").order("created_at", { ascending: false }).limit(limit);
        if (status) q = q.eq("status", status);
        if (template) q = q.eq("template", template);
        if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
        if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
        if (search) q = q.or(`recipient.ilike.%${search}%,subject.ilike.%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        // Уникальные шаблоны для фильтра
        const { data: tpls } = await admin.from("email_log").select("template").not("template", "is", null);
        const templates = Array.from(new Set((tpls ?? []).map((r: any) => r.template).filter(Boolean))).sort();

        return json({ items: data ?? [], templates });
      }

      // Ручное добавление тестовой записи (для отладки).
      case "emails.logTest": {
        const { error } = await admin.from("email_log").insert({
          recipient: String(payload?.recipient ?? "test@example.com"),
          subject: String(payload?.subject ?? "Тестовое письмо"),
          template: String(payload?.template ?? "test"),
          status: String(payload?.status ?? "sent"),
          error: payload?.error ? String(payload.error) : null,
          metadata: payload?.metadata ?? {},
        });
        if (error) throw error;
        return json({ ok: true });
      }

      // Удалить старые записи (старше N дней).
      case "emails.purge": {
        const days = Math.max(Number(payload?.days ?? 90), 1);
        const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
        const { error, count } = await admin.from("email_log").delete({ count: "exact" }).lt("created_at", cutoff);
        if (error) throw error;
        return json({ ok: true, deleted: count ?? 0 });
      }

      // ==================== ПЛАТЕЖИ ====================

      // Список записей платёжного журнала с фильтрами. Возвращаем + краткую инфу по заказу.
      case "payments.list": {
        const search = String(payload?.search ?? "").trim();
        const status = String(payload?.status ?? "").trim();
        const event = String(payload?.event ?? "").trim();
        const dateFrom = String(payload?.dateFrom ?? "").trim();
        const dateTo = String(payload?.dateTo ?? "").trim();
        const limit = Math.min(Math.max(Number(payload?.limit ?? 500), 1), 2000);

        let q = admin.from("payment_log").select("*").order("created_at", { ascending: false }).limit(limit);
        if (status) q = q.eq("status", status);
        if (event) q = q.eq("event", event);
        if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
        if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
        if (search) q = q.or(`payment_id.ilike.%${search}%,order_key.ilike.%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        // Подтягиваем номера заказов
        const orderIds = Array.from(new Set((data ?? []).map((r: any) => r.order_id).filter(Boolean)));
        const { data: orders } = orderIds.length
          ? await admin.from("orders").select("id, order_number, customer_name, total_amount, payment_status, refunded_amount").in("id", orderIds)
          : { data: [] as any[] };
        const orderMap = new Map((orders ?? []).map((o: any) => [o.id, o]));

        const items = (data ?? []).map((r: any) => ({
          ...r,
          order: r.order_id ? (orderMap.get(r.order_id) ?? null) : null,
        }));

        return json({ items });
      }

      // Выполнить возврат через Т-Кассу. Проксируем в tinkoff-payment.
      case "payments.refund": {
        const paymentId = String(payload?.paymentId ?? "").trim();
        const amount = Number(payload?.amount ?? 0);
        if (!paymentId) return json({ error: "paymentId required" }, 400);

        const url = `${SUPABASE_URL}/functions/v1/tinkoff-payment`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": ADMIN_PASSWORD,
            "Authorization": `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({ action: "refund", paymentId, amount, password: ADMIN_PASSWORD }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) return json({ error: data?.error ?? "refund failed", details: data }, resp.status);
        return json(data);
      }

      // Сводка по платежам для дашборда.
      case "payments.stats": {
        const { data } = await admin.from("payment_log").select("event, status, amount, created_at");
        const rows = data ?? [];
        const inits = rows.filter((r: any) => r.event === "init").length;
        const confirmed = rows.filter((r: any) => r.status === "CONFIRMED").length;
        const refunded = rows.filter((r: any) => r.event === "refund").length;
        const errors = rows.filter((r: any) => r.event === "error" || (r.status && String(r.status).startsWith("REJECTED"))).length;
        return json({ data: { inits, confirmed, refunded, errors, total: rows.length } });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }


  } catch (err: any) {
    console.error("admin-api error", err);
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});
