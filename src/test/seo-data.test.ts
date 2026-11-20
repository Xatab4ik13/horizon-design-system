import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfig, publicRows } from "../../scripts/seo-data";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
beforeEach(() => {
  vi.stubGlobal("AbortSignal", { timeout: () => new AbortController().signal });
});

describe("SEO public data", () => {
  it("uses hosting configuration instead of preview configuration", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://api.faktura-wood.com/");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
    expect(apiConfig()).toEqual({ url: "https://api.faktura-wood.com", key: "test-public-key" });
  });

  it("refuses partial exports on an API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(publicRows("blog_posts?select=slug")).rejects.toThrow("503");
  });

  it("keeps all pages beyond the API page limit", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, id) => ({ id }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1000 }] });
    vi.stubGlobal("fetch", fetchMock);
    expect(await publicRows("products?select=id")).toHaveLength(1001);
    expect(fetchMock.mock.calls[1][0]).toContain("offset=1000");
  });
});