// Единый источник настроек перевозчиков.
// Приоритет: значения из БД (app_settings.delivery_credentials) → значения из .env.
// Позволяет владельцу сайта самому вводить ключи в админке, не трогая сервер.

export type CdekCreds = {
  account: string;
  password: string;
  baseUrl: string;             // https://api.cdek.ru | https://api.edu.cdek.ru
  environment: "prod" | "test";
  source: "db" | "env" | "none";
};

export type PekCreds = {
  login: string;
  key: string;
  baseUrl: string;             // https://kabinet.pecom.ru/api/v1 (можно переопределить)
  source: "db" | "env" | "none";
};

export type YandexCreds = {
  token: string;
  baseUrl: string;             // https://b2b.taxi.yandex.net | https://b2b.taxi.tst.yandex.net
  environment: "prod" | "test";
  source: "db" | "env" | "none";
};

export type DeliveryCreds = {
  cdek: CdekCreds;
  pek: PekCreds;
  yandex: YandexCreds;
};

const CDEK_PROD = "https://api.cdek.ru";
const CDEK_TEST = "https://api.edu.cdek.ru";
const PEK_DEFAULT = "https://kabinet.pecom.ru/api/v1";
const YA_PROD = "https://b2b.taxi.yandex.net";
const YA_TEST = "https://b2b.taxi.tst.yandex.net";

function pick(dbVal: unknown, envVal: string): { value: string; source: "db" | "env" | "none" } {
  const d = typeof dbVal === "string" ? dbVal.trim() : "";
  if (d) return { value: d, source: "db" };
  if (envVal) return { value: envVal, source: "env" };
  return { value: "", source: "none" };
}

// admin — supabase client с service_role
export async function loadDeliveryCreds(admin: any): Promise<DeliveryCreds> {
  let db: Record<string, any> = {};
  try {
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "delivery_credentials")
      .maybeSingle();
    db = (data?.value ?? {}) as Record<string, any>;
  } catch {
    db = {};
  }

  const cdekDb = db.cdek ?? {};
  const pekDb = db.pek ?? {};
  const yaDb = db.yandex ?? {};

  const cdekAcc = pick(cdekDb.account, Deno.env.get("CDEK_ACCOUNT") ?? "");
  const cdekPwd = pick(cdekDb.password, Deno.env.get("CDEK_SECURE_PASSWORD") ?? "");
  const cdekEnv: "prod" | "test" = cdekDb.environment === "test" ? "test" : "prod";
  const cdekBase =
    (typeof cdekDb.base_url === "string" && cdekDb.base_url.trim()) ||
    (cdekEnv === "test" ? CDEK_TEST : CDEK_PROD);
  // Итоговый source — самый «слабый» из двух полей: если хоть одно из env — считаем env; если оба none — none.
  const cdekSource: "db" | "env" | "none" =
    cdekAcc.source === "none" || cdekPwd.source === "none"
      ? cdekAcc.source === "none" && cdekPwd.source === "none" ? "none" : "env"
      : cdekAcc.source === "db" && cdekPwd.source === "db" ? "db" : "env";

  const pekLogin = pick(pekDb.login, Deno.env.get("PEK_API_LOGIN") ?? "");
  const pekKey = pick(pekDb.key, Deno.env.get("PEK_API_KEY") ?? "");
  const pekBase =
    (typeof pekDb.base_url === "string" && pekDb.base_url.trim().replace(/\/$/, "")) ||
    PEK_DEFAULT;
  const pekSource: "db" | "env" | "none" =
    pekLogin.source === "none" || pekKey.source === "none"
      ? pekLogin.source === "none" && pekKey.source === "none" ? "none" : "env"
      : pekLogin.source === "db" && pekKey.source === "db" ? "db" : "env";

  const yaTok = pick(yaDb.token, Deno.env.get("YANDEX_DELIVERY_TOKEN") ?? "");
  const yaEnv: "prod" | "test" = yaDb.environment === "test" ? "test" : "prod";
  const yaBase =
    (typeof yaDb.base_url === "string" && yaDb.base_url.trim().replace(/\/$/, "")) ||
    (yaEnv === "test" ? YA_TEST : YA_PROD);

  return {
    cdek: {
      account: cdekAcc.value,
      password: cdekPwd.value,
      baseUrl: cdekBase.replace(/\/$/, ""),
      environment: cdekEnv,
      source: cdekSource,
    },
    pek: {
      login: pekLogin.value,
      key: pekKey.value,
      baseUrl: pekBase,
      source: pekSource,
    },
    yandex: {
      token: yaTok.value,
      baseUrl: yaBase,
      environment: yaEnv,
      source: yaTok.source,
    },
  };
}
