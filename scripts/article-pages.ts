import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { publishedArticles } from "./seo-data";
import { articleHtml, blogHtml } from "./article-html";

// Same text for users and crawlers; the existing React app takes over after loading.
export function articlePages(): Plugin {
  let outDir = "dist";
  return {
    name: "faktura-article-pages",
    apply: "build",
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    async closeBundle() {
      const posts = await publishedArticles();
      const template = readFileSync(resolve(outDir, "index.html"), "utf8");
      mkdirSync(resolve(outDir, "blog"), { recursive: true });
      writeFileSync(resolve(outDir, "blog/index.html"), blogHtml(template, posts));
      for (const post of posts) {
        const dir = resolve(outDir, "blog", encodeURIComponent(post.slug));
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, "index.html"), articleHtml(template, post));
      }
      console.log(`SEO: generated blog and ${posts.length} complete article HTML pages`);
    },
  };
}