import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "faktura_admin_pwd";
const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

  // Ретрай для cold-start edge function: первый запрос может отвалиться
  // сетевой ошибкой — делаем 1 повтор. Таймаут на запрос укоротили до 15с,
  // чтобы при массовых параллельных вызовах (Контент сайта / Настройки)
  // суммарная задержка не уходила в минуты.
  let lastErr: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      const response = await fetch(ADMIN_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: PUBLISHABLE_KEY,
          Authorization: `Bearer ${PUBLISHABLE_KEY}`,
          "x-admin-password": password,
        },
        body: JSON.stringify({ action, payload, password }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.error ?? `Ошибка админ API: ${response.status}`;
        const status = response.status;
        if (status && status >= 400 && status < 500) throw new Error(message);
        lastErr = new Error(message);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        throw lastErr;
      }
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? "");
      const isNetwork = /Failed to send|Failed to fetch|NetworkError|timeout|aborted/i.test(msg);
      if (!isNetwork || attempt >= 1) throw e;
      await new Promise((r) => setTimeout(r, 400));
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

// Кладёт значение в SWR-кэш в том виде, в каком его вернул бы adminCall.
// Полезно для batch-префетча (settings.getMulti), чтобы последующие
// adminCallSWR("settings.get", { key }) сразу отдавали данные.
export function seedAdminCache(action: string, payload: any, value: any) {
  const key = action + ":" + JSON.stringify(payload ?? null);
  swrCache.set(key, value);
}

// Префетч группы настроек одним запросом. Результат раскладывается в кэш
// под ключами отдельных settings.get-вызовов, поэтому редакторы получат
// данные мгновенно через adminCallSWR.
export async function prefetchAdminSettings(keys: string[]): Promise<void> {
  if (!keys.length) return;
  try {
    const r = await adminCall<{ data: Record<string, any> }>("settings.getMulti", { keys });
    const map = r?.data ?? {};
    for (const k of keys) {
      seedAdminCache("settings.get", { key: k }, { data: map[k] ?? {} });
    }
  } catch {
    // тихо: редакторы откатятся к индивидуальным запросам
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
  const uploadPath = r.data.path || path;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const contentType = file.type ||
    (ext === "webp" ? "image/webp" :
      ext === "glb" ? "model/gltf-binary" :
        ext === "usdz" ? "model/vnd.usdz+zip" : "application/octet-stream");
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(uploadPath, token, file, { contentType, upsert: true });
  if (error) throw error;
  return publicUrl;
}
