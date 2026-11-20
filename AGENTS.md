# Architecture rules

- Use the hosting environment before local configuration for SEO exports, so production pages use the same public API as production visitors.
- Generate blog and article HTML during the existing Vite build, retaining the React application and identical article content, so crawlers can read full text and page-specific metadata without JavaScript.
- Abort SEO exports on API failure rather than publishing an incomplete sitemap; modification dates must come from page-specific publication data, never build time.