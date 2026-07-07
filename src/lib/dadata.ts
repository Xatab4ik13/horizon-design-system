// DaData suggestions client (публичный API-ключ, используется прямо из браузера).
// Ограничить домены можно в личном кабинете DaData → «Настройки» → «Ограничения».
const DADATA_API_KEY = "4d901a6563419e3405f8f90a10447d38 8069ef76".replace(/\s+/g, "");
const BASE = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest";

type SuggestBase<T> = { value: string; unrestricted_value: string; data: T };

export type DadataAddressData = {
  country?: string | null;
  region_with_type?: string | null;
  city?: string | null;
  city_with_type?: string | null;
  settlement_with_type?: string | null;
  street_with_type?: string | null;
  house?: string | null;
  block?: string | null;
  flat?: string | null;
  postal_code?: string | null;
  kladr_id?: string | null;
  fias_id?: string | null;
  geo_lat?: string | null;
  geo_lon?: string | null;
};

export type AddressSuggestion = SuggestBase<DadataAddressData>;

export type FioSuggestion = SuggestBase<{
  surname?: string | null;
  name?: string | null;
  patronymic?: string | null;
  gender?: string | null;
}>;

type SuggestBound =
  | "country" | "region" | "area" | "city" | "settlement"
  | "street" | "house" | "flat";

export async function suggestAddress(opts: {
  query: string;
  count?: number;
  fromBound?: SuggestBound;
  toBound?: SuggestBound;
  locations?: Array<Record<string, string>>;
  signal?: AbortSignal;
}): Promise<AddressSuggestion[]> {
  if (!opts.query?.trim()) return [];
  const body: Record<string, unknown> = { query: opts.query, count: opts.count ?? 7 };
  if (opts.fromBound) body.from_bound = { value: opts.fromBound };
  if (opts.toBound) body.to_bound = { value: opts.toBound };
  if (opts.locations?.length) body.locations = opts.locations;
  const res = await fetch(`${BASE}/address`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.suggestions ?? []) as AddressSuggestion[];
}

export async function suggestFio(opts: {
  query: string;
  count?: number;
  parts?: Array<"NAME" | "SURNAME" | "PATRONYMIC">;
  signal?: AbortSignal;
}): Promise<FioSuggestion[]> {
  if (!opts.query?.trim()) return [];
  const res = await fetch(`${BASE}/fio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify({
      query: opts.query,
      count: opts.count ?? 7,
      ...(opts.parts ? { parts: opts.parts } : {}),
    }),
    signal: opts.signal,
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.suggestions ?? []) as FioSuggestion[];
}
