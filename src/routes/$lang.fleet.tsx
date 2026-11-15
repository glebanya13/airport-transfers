import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Users } from "lucide-react";
import { locName, t, type Lang } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";
import { useCatalog, useLang } from "./$lang";

export const Route = createFileRoute("/$lang/fleet")({
  head: ({ params }) => {
    const tr = t(params.lang as Lang);
    return pageHead(params.lang, "/fleet", `${tr.fleet_title} — ${tr.brand}`, "Economy, Business, Minivan, Premium.");
  },
  component: Fleet,
});

function Fleet() {
  const lang = useLang();
  const tr = t(lang);
  const c = useCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{tr.fleet_title}</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {c.classes.map((k) => (
          <div key={k.id} className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-2xl font-bold">{locName(k, lang)}</h2>
            <div className="mt-3 flex gap-6 text-muted-foreground">
              <span className="flex items-center gap-2"><Users className="h-5 w-5" />1–{k.max_pax} {tr.pax}</span>
              <span className="flex items-center gap-2"><Briefcase className="h-5 w-5" />{k.max_luggage} {tr.bags}</span>
            </div>
            <Link to="/$lang/book" params={{ lang }} search={{ cls: k.id }} className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">{tr.book_this}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
