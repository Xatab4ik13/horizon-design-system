/**
 * Экспорт всех файлов Storage из Lovable Cloud в локальную папку ./storage-dump.
 *
 * Запуск:
 *   SUPABASE_URL=https://<lovable>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   bun run server/scripts/export-storage.ts
 *
 * Затем на сервере запускаем import-storage.ts с новыми URL/KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");

const OUT = "./storage-dump";
const BUCKETS = ["product-images", "blog-images", "product-models", "site-images", "site-documents"];

const supa = createClient(URL, KEY, { auth: { persistSession: false } });

async function listAll(bucket: string, prefix = ""): Promise<string[]> {
  const acc: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supa.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const it of data) {
      if (it.id === null) {
        // папка
        acc.push(...(await listAll(bucket, prefix ? `${prefix}/${it.name}` : it.name)));
      } else {
        acc.push(prefix ? `${prefix}/${it.name}` : it.name);
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return acc;
}

for (const bucket of BUCKETS) {
  console.log(`\n=== ${bucket} ===`);
  const paths = await listAll(bucket);
  console.log(`  файлов: ${paths.length}`);
  for (const p of paths) {
    const { data, error } = await supa.storage.from(bucket).download(p);
    if (error) { console.warn(`  ! ${p}: ${error.message}`); continue; }
    const buf = Buffer.from(await data.arrayBuffer());
    const outPath = join(OUT, bucket, p);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, buf);
    process.stdout.write(".");
  }
}
console.log("\nГотово. Папка:", OUT);
