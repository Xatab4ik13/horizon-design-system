import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://faktura.ru";
const SITE_NAME = "FAKTURA";
const DEFAULT_TITLE = "FAKTURA — Мастерская изделий из натурального дерева";
const DEFAULT_DESCRIPTION = "Уникальные изделия ручной работы из массива дерева: панно, зеркала, мебель, кухонные аксессуары. Индивидуальные заказы, доставка по России.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  article?: {
    publishedTime?: string;
    author?: string;
    section?: string;
  };
}

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = "website",
  canonical,
  noindex = false,
  jsonLd,
  article,
}: SEOProps) => {
  const location = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Basic meta
    setMeta("name", "description", description);
    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    }

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "ru_RU");

    // Article OG
    if (article) {
      if (article.publishedTime) setMeta("property", "article:published_time", article.publishedTime);
      if (article.author) setMeta("property", "article:author", article.author);
      if (article.section) setMeta("property", "article:section", article.section);
    }

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // JSON-LD
    // Remove old ones
    document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());

    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    // Always add Organization
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+7-999-123-45-67",
        contactType: "customer service",
        areaServed: "RU",
        availableLanguage: "Russian",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Мастеровая, 12",
        addressLocality: "Москва",
        addressCountry: "RU",
      },
    };

    const webSiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/catalog?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const allSchemas = [orgSchema, webSiteSchema, ...schemas];

    allSchemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    };
  }, [fullTitle, description, image, type, canonicalUrl, noindex, jsonLd, article]);

  return null;
};

export default SEO;

// ─── JSON-LD Builders ───

export const buildProductJsonLd = (product: {
  name: string;
  description: string;
  sku: string;
  price: number;
  oldPrice?: number;
  images: string[];
  inStock: boolean;
  rating: number;
  reviews: { author: string; rating: number; text: string; date: string }[];
  material: string;
  id: string;
}) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    material: product.material,
    brand: {
      "@type": "Brand",
      name: "FAKTURA",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "RUB",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      seller: {
        "@type": "Organization",
        name: "FAKTURA",
      },
    },
  };

  if (product.rating > 0 && product.reviews.length > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
    schema.review = product.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
      },
      reviewBody: r.text,
      datePublished: r.date,
    }));
  }

  return schema;
};

export const buildArticleJsonLd = (article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  id: number | string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.description,
  author: {
    "@type": "Person",
    name: article.author,
  },
  publisher: {
    "@type": "Organization",
    name: "FAKTURA",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.ico`,
    },
  },
  datePublished: article.datePublished,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${SITE_URL}/blog/${article.id}`,
  },
});

export const buildBreadcrumbJsonLd = (
  items: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

export const buildFAQJsonLd = (
  questions: { question: string; answer: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((q) => ({
    "@type": "Question",
    name: q.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: q.answer,
    },
  })),
});
