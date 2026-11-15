import { createFileRoute, Link, notFound, Outlet, useLocation } from "@tanstack/react-router";
import { MessageCircle, Plane } from "lucide-react";
import { getCatalog } from "@/lib/catalog.functions";
import { isLang, LANGS, t, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: () => getCatalog(),
  staleTime: 60_000,
  head: ({ params }) => ({
    meta: [{ httpEquiv: "content-language", content: params.lang }],
  }),
  component: LangLayout,
});

export function useLang(): Lang {
  return Route.useParams().lang as Lang;
}
export const useCatalog = () => Route.useLoaderData();

function LangLayout() {
  const lang = useLang();
  const tr = t(lang);
  const catalog = useCatalog();
  const { pathname } = useLocation();
  const rest = pathname.replace(/^\/(en|es|ru)/, "");
  const wa = catalog.settings.whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/$lang" params={{ lang }} className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Plane className="h-5 w-5" /></span>
            {tr.brand}
          </Link>
          <nav className="ml-auto hidden items-center gap-5 text-sm font-medium md:flex">
            <Link to="/$lang/prices" params={{ lang }} className="hover:text-primary">{tr.nav_prices}</Link>
            <Link to="/$lang/fleet" params={{ lang }} className="hover:text-primary">{tr.nav_fleet}</Link>
            <Link to="/$lang/my-booking" params={{ lang }} className="hover:text-primary">{tr.nav_my}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1 text-sm md:ml-0">
            {LANGS.map((l) => (
              <a key={l} href={`/${l}${rest}`} hrefLang={l}
                className={`rounded-md px-2 py-1 uppercase ${l === lang ? "bg-primary-soft font-bold text-primary" : "text-muted-foreground"}`}>{l}</a>
            ))}
          </div>
          <Link to="/$lang/book" params={{ lang }} className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:inline-block">{tr.nav_book}</Link>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <div className="font-display text-lg font-bold">{tr.brand}</div>
            <p className="mt-2 opacity-70">{catalog.settings.company_name}<br />Tax ID: [TAX ID] · License: [LICENSE NO.]</p>
          </div>
          <div className="opacity-80">
            <div>{catalog.settings.phone}</div><div>{catalog.settings.email}</div>
          </div>
          <div className="flex flex-col gap-1 opacity-80">
            <Link to="/$lang/prices" params={{ lang }}>{tr.nav_prices}</Link>
            <Link to="/$lang/fleet" params={{ lang }}>{tr.nav_fleet}</Link>
            <Link to="/$lang/my-booking" params={{ lang }}>{tr.nav_my}</Link>
          </div>
        </div>
        <div className="border-t border-ink-foreground/10 py-4 text-center text-xs opacity-60">{tr.footer_note}</div>
      </footer>
      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-float">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
