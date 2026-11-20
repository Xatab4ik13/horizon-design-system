# SEO recovery

- [x] Update the sitemap from the production data source without fabricated modification dates: 63 addresses, 41 articles, 8 active products.
- [x] Generate article text and individual metadata in HTML; distinguish API failures from missing articles and noindex missing articles.
- [x] Verify data-export tests, all 42 generated HTML documents and browser article/error flows.
- [ ] Production deployment and HTTP verification: waiting for Timeweb rebuild; host must serve generated blog/*/index.html instead of the SPA fallback. Soft 404 resolution requires a subsequent Yandex crawl.
- [ ] Submit recrawl requests: Yandex POST returns HTTP 504; GET queue and quota work, but no new submission was confirmed.
- [ ] Enable crawl-through-Metrica: no supported API endpoint found; enable counter 112838914 in Webmaster → Indexing → Crawl by counters.