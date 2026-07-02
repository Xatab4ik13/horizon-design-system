/**
 * Заливка ./storage-dump в self-hosted Supabase.
 *
 * Запуск:
 *   SUPABASE_URL=https://api.faktura.ru \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   bun run server/scripts/import-storage.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");

const IN = "./storage-dump";
const BUCKETS = ["product-images", "blog-images", "product-models", "site-images", "site-documents"];
const PUBLIC = new Set(BUCKETS); // все наши бакеты публичные

const supa = createClient(URL, KEY, { auth: { persistSession: false } });

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

function contentType(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext === "webp" ? "image/webp"
    : ext === "png" ? "image/png"
    : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
    : ext === "glb" ? "model/gltf-binary"
    : ext === "usdz" ? "model/vnd.usdz+zip"
    : ext === "pdf" ? "application/pdf"
    : "application/octet-stream";
}

for (const bucket of BUCKETS) {
  console.log(`\n=== ${bucket} ===`);
  // создать бакет, если нет
  const { data: existing } = await supa.storage.getBucket(bucket);
  if (!existing) {
    await supa.storage.createBucket(bucket, { public: PUBLIC.has(bucket) });
  }
  const root = join(IN, bucket);
  let files: string[] = [];
  try { files = await walk(root); } catch { console.log("  (пусто)"); continue; }
  console.log(`  файлов: ${files.length}`);
  for (const f of files) {
    const key = relative(root, f).replaceAll("\\", "/");
    const body = await readFile(f);
    const { error } = await supa.storage.from(bucket).upload(key, body, {
      contentType: contentType(f), upsert: true,
    });
    if (error) console.warn(`  ! ${key}: ${error.message}`);
    else process.stdout.write(".");
  }
}
console.log("\nГотово.");
