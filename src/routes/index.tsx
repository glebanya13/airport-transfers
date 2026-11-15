import { createFileRoute, redirect } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/$lang", params: { lang: "en" } });
  },
  head: () => ({
    links: [
      { rel: "canonical", href: `${SITE_URL}/en` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/en` },
      { rel: "alternate", hrefLang: "es", href: `${SITE_URL}/es` },
      { rel: "alternate", hrefLang: "ru", href: `${SITE_URL}/ru` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/en` },
    ],
  }),
});
