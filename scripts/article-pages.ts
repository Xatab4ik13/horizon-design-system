import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { publishedArticles } from "./seo-data";
import { articleHtml, blogHtml, documentHtml } from "./article-html";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CncServiceContent from "../src/components/CncServiceContent";
import { CNC_SERVICE, cncServiceSchema } from "../src/data/cnc-service";

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
      const serviceDir = resolve(outDir, "services/cnc-milling");
      mkdirSync(serviceDir, { recursive: true });
      const serviceBody = `<main class="min-h-screen bg-background text-foreground pt-32 pb-20"><div class="container mx-auto px-4"><nav class="mb-8"><a href="/services">Услуги</a></nav>${renderToStaticMarkup(createElement(CncServiceContent))}<a class="text-primary" href="/contacts">Оставить заявку</a></div></main><script type="application/ld+json" data-seo-jsonld>${JSON.stringify(cncServiceSchema()).replace(/</g, "\\u003c")}</script>`;
      writeFileSync(resolve(serviceDir, "index.html"), documentHtml(template, CNC_SERVICE.seoTitle, CNC_SERVICE.description, CNC_SERVICE.path, serviceBody, "website"));
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