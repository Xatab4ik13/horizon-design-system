import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "faktura_admin_pwd";

export const adminAuth = {
  get password(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
  },
  set(pwd: string) {
    sessionStorage.setItem(STORAGE_KEY, pwd);
  },
  clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
  isLoggedIn() {
    return !!sessionStorage.getItem(STORAGE_KEY);
  },
};

export async function adminCall<T = any>(
  action: string,
  payload?: any,
  passwordOverride?: string,
): Promise<T> {
  const password = passwordOverride ?? adminAuth.password ?? "";

  // Ретрай для cold-start edge function: первый запрос часто отваливается
  // с "Failed to send a request to the Edge Function" — повторяем до 2 раз.
  let lastErr: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke("admin-api", {
        body: { action, payload, password },
        headers: { "x-admin-password": password },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let message = error.message;
        let status = ctx?.status;
        if (ctx?.json) {
          try {
            const j = await ctx.json();
            message = j.error ?? message;
          } catch {
            // ignore
          }
        }
        // 401/400/403 — не ретраим, реальная ошибка
        if (status && status >= 400 && status < 500) throw new Error(message);
        lastErr = new Error(message);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        throw lastErr;
      }
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      lastErr = e;
      // Сетевые / cold-start ошибки — ретраим
      const msg = String(e?.message ?? "");
      const isNetwork = /Failed to send|Failed to fetch|NetworkError|timeout|aborted/i.test(msg);
      if (!isNetwork || attempt >= 2) throw e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr ?? new Error("Unknown error");
}

// ─── Stale-while-revalidate cache for read-only admin calls ───
const swrCache = new Map<string, any>();
const swrInflight = new Map<string, Promise<any>>();

export function getCachedAdminCall<T = any>(action: string, payload?: any): T | null {
  const key = action + ":" + JSON.stringify(payload ?? null);
  return (swrCache.get(key) as T) ?? null;
}

export async function adminCallSWR<T = any>(
  action: string,
  payload?: any,
  onUpdate?: (data: T) => void,
): Promise<T> {
  const key = action + ":" + JSON.stringify(payload ?? null);
  const cached = swrCache.get(key) as T | undefined;
  const refresh = () => {
    if (swrInflight.has(key)) return swrInflight.get(key)!;
    const p = adminCall<T>(action, payload)
      .then((data) => {
        swrCache.set(key, data);
        swrInflight.delete(key);
        if (cached && onUpdate) onUpdate(data);
        return data;
      })
      .catch((e) => {
        swrInflight.delete(key);
        throw e;
      });
    swrInflight.set(key, p);
    return p;
  };
  if (cached !== undefined) {
    // fire-and-forget revalidate
    refresh().catch(() => {});
    return cached;
  }
  return refresh();
}

export function invalidateAdminCache(actionPrefix?: string) {
  if (!actionPrefix) {
    swrCache.clear();
    return;
  }
  for (const k of Array.from(swrCache.keys())) {
    if (k.startsWith(actionPrefix)) swrCache.delete(k);
  }
}


export async function adminLogin(password: string): Promise<boolean> {
  // 2 захода: на холодный старт edge функции первый вызов часто отваливается
  // сетевой ошибкой даже после внутренних ретраев adminCall.
  let lastErr: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await adminCall<{ ok: boolean }>("login", undefined, password);
      if (res?.ok) {
        adminAuth.set(password);
        return true;
      }
      return false;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? "");
      const isNetwork = /Failed to send|Failed to fetch|NetworkError|timeout|aborted/i.test(msg);
      // Если 4xx (неверный пароль) — сразу false
      if (!isNetwork) return false;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
    }
  }
  // Все попытки сетевые — пробрасываем, чтобы UI показал реальную причину
  throw lastErr ?? new Error("Сеть недоступна");
}

/**
 * Загрузка файла в Storage минуя лимит invoke 6 МБ.
 * Запрашивает signed upload URL у admin-api, затем PUT-ом грузит файл напрямую в Storage.
 */
export async function adminUploadFile(
  bucket: string,
  file: File,
  opts?: { prefix?: string },
): Promise<string> {
  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${opts?.prefix ?? ""}${Date.now()}-${safeName}`;
  const r = await adminCall<{ data: { token: string; path: string; publicUrl: string } }>(
    "storage.signUpload",
    { bucket, path },
  );
  const { token, publicUrl } = r.data;
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) throw error;
  return publicUrl;
}
