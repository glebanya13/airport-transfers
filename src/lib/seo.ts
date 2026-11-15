import { LANGS } from "./i18n";

export const SITE_URL = "https://airport-transfers-app-26.web.app";

export function pageHead(lang: string, path: string, title: string, description: string) {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const currentUrl = `${SITE_URL}/${lang}${cleanPath}`;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: lang },
      { property: "og:url", content: currentUrl },
      { property: "og:site_name", content: "Airport Transfers" },
      { property: "og:image", content: `${SITE_URL}/apple-touch-icon.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${SITE_URL}/apple-touch-icon.png` },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "canonical", href: currentUrl },
      ...LANGS.map((l) => ({ rel: "alternate", hrefLang: l, href: `${SITE_URL}/${l}${cleanPath}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/en${cleanPath}` },
    ],
  };
}
