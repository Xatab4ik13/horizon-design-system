import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { SITE_URL, type PublishedArticle } from "./seo-data";

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function documentHtml(template: string, title: string, description: string, path: string, body: string, type: string) {
  const url = `${SITE_URL}${path}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)} | FAKTURA</title>`)
    .replace(/<meta\s+(?:name|property)="(?:description|og:title|og:description|og:type|og:url|twitter:title|twitter:description)"[^>]*>/g, "")
    .replace(/<link\s+rel="canonical"[^>]*>/g, "")
    .replace("</head>", `<meta name="description" content="${escape(description)}" />
<meta property="og:title" content="${escape(title)} | FAKTURA" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:type" content="${type}" />
<meta property="og:url" content="${escape(url)}" />
<meta name="twitter:title" content="${escape(title)} | FAKTURA" />
<meta name="twitter:description" content="${escape(description)}" />
<link rel="canonical" href="${escape(url)}" /></head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
}

export function articleHtml(template: string, post: PublishedArticle) {
  const path = `/blog/${encodeURIComponent(post.slug)}`;
  const title = post.seo_title?.trim() || post.title;
  const description = post.seo_description?.trim() || post.excerpt || post.title;
  const content = renderToStaticMarkup(createElement(ReactMarkdown, { children: post.content }));
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article", headline: post.title,
    description, datePublished: post.published_at || undefined,
    publisher: { "@type": "Organization", name: "FAKTURA" },
    mainEntityOfPage: `${SITE_URL}${path}`,
  }).replace(/</g, "\\u003c");
  const body = `<main class="min-h-screen bg-background text-foreground pt-32 pb-20"><div class="container mx-auto px-4 max-w-3xl"><nav class="text-sm text-muted-foreground mb-8"><a href="/">FAKTURA</a> · <a href="/blog">Блог</a></nav><article><h1 class="text-3xl md:text-4xl font-bold mb-4 leading-tight">${escape(post.title)}</h1>${post.excerpt ? `<p class="text-lg leading-relaxed mb-8">${escape(post.excerpt)}</p>` : ""}<div class="prose prose-invert max-w-none leading-relaxed">${content}</div></article></div></main><script type="application/ld+json" data-seo-jsonld>${schema}</script>`;
  return documentHtml(template, title, description, path, body, "article");
}

export function blogHtml(template: string, posts: PublishedArticle[]) {
  const body = `<main class="min-h-screen bg-background text-foreground pt-32 pb-20"><div class="container mx-auto px-4"><a href="/">FAKTURA</a><h1 class="text-4xl font-bold mb-12">Блог</h1><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${posts.map(post => `<article class="bg-card border border-border rounded-2xl p-6"><h2 class="text-lg font-semibold mb-3"><a href="/blog/${encodeURIComponent(post.slug)}">${escape(post.title)}</a></h2><p class="text-muted-foreground">${escape(post.excerpt || "")}</p></article>`).join("")}</div></div></main>`;
  return documentHtml(template, "Блог о мебели из массива и изделиях из дерева", "Статьи мастерской FAKTURA: породы дерева, покрытия и уход за мебелью.", "/blog", body, "website");
}