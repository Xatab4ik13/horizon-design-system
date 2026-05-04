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
  const { data, error } = await supabase.functions.invoke("admin-api", {
    body: { action, payload, password },
    headers: { "x-admin-password": password },
  });
  if (error) {
    // FunctionsHttpError содержит response в context
    const ctx: any = (error as any).context;
    let message = error.message;
    if (ctx?.json) {
      try {
        const j = await ctx.json();
        message = j.error ?? message;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function adminLogin(password: string): Promise<boolean> {
  try {
    const res = await adminCall<{ ok: boolean }>("login", undefined, password);
    if (res?.ok) {
      adminAuth.set(password);
      return true;
    }
    return false;
  } catch {
    return false;
  }
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
