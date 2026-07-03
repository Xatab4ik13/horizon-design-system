import { Helmet } from "react-helmet-async";
import { useSeoPage, type SeoPageKey } from "@/hooks/useSiteContent";

type Props = {
  pageKey: SeoPageKey;
  defaultTitle: string;
  defaultDescription: string;
  path?: string;                // canonical path, e.g. "/gallery"
  defaultOgImage?: string;      // absolute or root-relative
};

/**
 * Универсальный SEO-компонент: title / description / canonical / og:* / twitter:*.
 * Значения из БД (app_settings.seo[pageKey]) перекрывают defaults.
 */
export function SEO({ pageKey, defaultTitle, defaultDescription, path = "/", defaultOgImage }: Props) {
  const seo = useSeoPage(pageKey);
  const title = (seo?.title || "").trim() || defaultTitle;
  const description = (seo?.description || "").trim() || defaultDescription;
  const ogImage = (seo?.ogImage || "").trim() || defaultOgImage || "";
  const canonical = path.startsWith("http") ? path : path;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
