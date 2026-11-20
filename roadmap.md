# SEO recovery

## Evidence-based article expansion
- [x] Check all 41 published topics, Semrush RU data and competitor pages; avoid duplicate furniture guides.
- [x] Prepare three CNC articles with ordering checklists, verified workshop facts and service links; Google editorial review applied, no invented prices or ranking guarantees.
- [x] Validate PostgreSQL syntax, three generated HTML articles and draft desktop/mobile rendering; six existing SEO/CNC tests passed. Production SQL execution remains unverified.
- [ ] Import into the production database and deploy generated article HTML (requires access to the VPS / Timeweb).

## CNC milling promotion
- [x] Research Russian commercial search demand and competitor service pages: Semrush RU and four inspected commercial pages; limited volume evidence documented.
- [x] Write and execute the SEO plan in docs/seo-cnc-plan.md: service page, links, confirmed materials, field and address.
- [x] Independently review copy through Google API; apply repetition edits and document limits in docs/seo-cnc-editorial-review.md.
- [x] Add crawlable service content and verify desktop/mobile navigation, prefilled inquiry and contact address; six concrete data tests passed. Inquiry intentionally not submitted to production.
- [ ] Publish and verify production changes after Timeweb deployment (external dependency).

- [x] Update the sitemap from the production data source without fabricated modification dates: 63 addresses, 41 articles, 8 active products.
- [x] Generate article text and individual metadata in HTML; distinguish API failures from missing articles and noindex missing articles.
- [x] Verify data-export tests, all 42 generated HTML documents and browser article/error flows.
- [ ] Production deployment and HTTP verification: waiting for Timeweb rebuild; host must serve generated blog/*/index.html instead of the SPA fallback. Soft 404 resolution requires a subsequent Yandex crawl.
- [ ] Submit recrawl requests: Yandex POST returns HTTP 504; GET queue and quota work, but no new submission was confirmed.
- [ ] Enable crawl-through-Metrica: blocked by Yandex service outage, confirmed by the owner's screenshot; linked counter remains correctly configured.