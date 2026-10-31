import { CROSX_LOGO_URL, CROSX_SITE_URL } from "./brand";

const rawEnvSiteUrl =
  (import.meta.env?.["VITE_SITE_URL"] as string | undefined)?.trim() ||
  (typeof process !== "undefined" ? process.env["SITE_URL"]?.trim() : undefined);

const resolvedSiteUrl =
  rawEnvSiteUrl && !rawEnvSiteUrl.endsWith(".lovable.app")
    ? rawEnvSiteUrl
    : CROSX_SITE_URL;

export const SITE_URL = resolvedSiteUrl.replace(/\/+$/, "");
export const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "rca.crosx.in";
  }
})();
export const SITE_NAME = "Redirect Chain Analyzer — CROSX";
export const BRAND_NAME = "CROSX";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icons/icon-512.png`;
export const DEFAULT_OG_IMAGE_ALT =
  "Redirect Chain Analyzer by CROSX — Trace HTTP 301/302/307/308, Meta Refresh & JavaScript Redirects";

export const CORE_KEYWORDS = [
  "redirect chain analyzer",
  "redirect checker",
  "url redirect tracer",
  "301 redirect checker",
  "302 redirect checker",
  "307 308 redirect analyzer",
  "meta refresh redirect checker",
  "javascript redirect detector",
  "affiliate link tracker",
  "cloaked link unshortener",
  "utm parameter tracker",
  "redirect loop detector",
  "canonical url checker",
  "http response headers viewer",
  "bulk redirect checker",
  "short link generator",
  "trace url hops",
  "seo redirect audit tool",
  "rca.crosx.in",
  "CROSX",
].join(", ");

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  keywords?: string;
  twitterCard?: "summary_large_image" | "summary";
}

export function canonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${cleanPath.replace(/\/+$/, "")}`;
}

export function buildPageMeta(input: PageSeoInput) {
  const url = canonicalUrl(input.path);
  const robotsContent = input.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return [
    { title: input.title },
    { name: "description", content: input.description },
    { name: "keywords", content: input.keywords ?? CORE_KEYWORDS },
    { name: "author", content: BRAND_NAME },
    { name: "publisher", content: BRAND_NAME },
    { name: "robots", content: robotsContent },
    { name: "googlebot", content: robotsContent },
    { name: "bingbot", content: robotsContent },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:image", content: DEFAULT_OG_IMAGE },
    { property: "og:image:secure_url", content: DEFAULT_OG_IMAGE },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "512" },
    { property: "og:image:height", content: "512" },
    { property: "og:image:alt", content: DEFAULT_OG_IMAGE_ALT },
    { name: "twitter:card", content: input.twitterCard ?? "summary_large_image" },
    { name: "twitter:domain", content: SITE_HOST },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    { name: "twitter:image:alt", content: DEFAULT_OG_IMAGE_ALT },
  ];
}

export function buildCanonicalLinks(path: string) {
  const url = canonicalUrl(path);
  return [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "en", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
  ];
}

export function buildHomeStructuredData(description: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND_NAME,
        legalName: "CROSX Advertising & Marketing Agency",
        url: SITE_URL,
        sameAs: [SITE_URL, "https://rca.api.crosx.in"],
        logo: {
          "@type": "ImageObject",
          url: CROSX_LOGO_URL,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: "Redirect & URL Trace Engine — Every Hop, HTTP or JavaScript",
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#webapp` },
        inLanguage: "en-US",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", "h2"],
        },
      },
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${SITE_URL}/#webapp`,
        name: "Redirect Chain Analyzer",
        alternateName: "CROSX Redirect & URL Trace Engine",
        url: `${SITE_URL}/`,
        description,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "SEO & Network Forensics Tool",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
        featureList: [
          "Server-side HTTP 301, 302, 303, 307, and 308 redirect chain tracing",
          "HTML meta http-equiv refresh redirect detection",
          "JavaScript window.location and location.replace redirect extraction",
          "Headless browser navigation fallback for script-gated hops",
          "Affiliate click_id, gclid, fbclid, and UTM tracking parameter diffing",
          "SEO canonical tag, meta robots, and HTTPS protocol upgrade/downgrade audit",
          "Bulk URL analysis up to 20 URLs per batch with TXT and JSON report export",
          "SSRF-hardened server-side execution with per-hop latency timings",
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Redirect Chain Analyzer",
            item: `${SITE_URL}/`,
          },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/#howto`,
        name: "How to Trace a URL Redirect Chain and Audit SEO Signals",
        description:
          "Follow every HTTP, meta refresh, and JavaScript redirect hop to inspect status codes, headers, SEO canonicals, and tracking parameters.",
        totalTime: "PT15S",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Enter a URL or enable Bulk Mode",
            text: "Paste any single URL, short link, or affiliate tracking link—or switch to Bulk mode to queue up to 20 URLs at once.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Run Server-Side Redirect Trace",
            text: "Click Analyze to trace the full chain server-side across HTTP 301/302/307/308 redirects, meta refresh tags, and JavaScript navigation.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Inspect Hops, Headers, SEO Signals & Tracking Diffs",
            text: "Review hop-by-hop response times, HTTP headers, canonical URLs, HTTPS status, and dropped UTM or affiliate parameters, then export to JSON or TXT.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What redirect mechanisms does Redirect Chain Analyzer detect?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Redirect Chain Analyzer performs real server-side requests to trace HTTP status redirects (301, 302, 303, 307, 308), HTML meta refresh tags, inline JavaScript redirects, and headless browser navigations up to 20 hops.",
            },
          },
          {
            "@type": "Question",
            name: "How do long redirect chains affect technical SEO and page speed?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each redirect hop adds network round-trip latency (TTFB), wastes search engine crawl budget, risks dropping canonical or UTM parameters, and can dilute link equity if temporary redirects or protocol downgrades occur.",
            },
          },
          {
            "@type": "Question",
            name: "Does the analyzer detect lost UTM and affiliate tracking parameters?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Every hop's query string is diffed automatically, highlighting added, modified, or stripped tracking parameters including utm_*, gclid, fbclid, msclkid, click_id, aff_id, and sub1–sub10.",
            },
          },
        ],
      },
    ],
  });
}

export function buildLinksStructuredData(description: string): string {
  const url = canonicalUrl("/links");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: "Short Links — Redirect Chain Analyzer",
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        name: "CROSX Transparent Short Link Manager",
        url,
        description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Redirect Chain Analyzer",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Short Links",
            item: url,
          },
        ],
      },
    ],
  });
}

export function buildApiDocsStructuredData(description: string): string {
  const url = canonicalUrl("/api-docs");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: "Chain Tracer API — Add Redirect Tracing to Your Own Website",
        description,
        url,
        author: { "@type": "Organization", name: BRAND_NAME },
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", "h2", "h3"],
        },
      },
      {
        "@type": "WebAPI",
        name: "CROSX Chain Tracer JSON API",
        description,
        documentation: url,
        termsOfService: `${SITE_URL}/api-docs`,
        provider: { "@type": "Organization", name: BRAND_NAME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Redirect Chain Analyzer",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Chain Tracer API",
            item: url,
          },
        ],
      },
    ],
  });
}

export function buildSharedReportStructuredData(description: string): string {
  const url = canonicalUrl("/r");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Report",
        name: "Shared Redirect Chain Analysis Report",
        description,
        url,
        publisher: { "@type": "Organization", name: BRAND_NAME },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Redirect Chain Analyzer",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Shared Redirect Report",
            item: url,
          },
        ],
      },
    ],
  });
}

