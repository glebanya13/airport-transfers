import { createFileRoute, Link } from "@tanstack/react-router";
import { locName, t, type Lang } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";
import { useCatalog, useLang } from "./$lang";

export const Route = createFileRoute("/$lang/prices")({
  head: ({ params }) => {
    const tr = t(params.lang as Lang);
    return pageHead(params.lang, "/prices", `${tr.nav_prices} — ${tr.brand}`, `${tr.badge_fixed}: ${tr.airport} ↔ ${tr.city}`);
  },
  component: Prices,
});

function Prices() {
  const lang = useLang();
  const tr = t(lang);
  const c = useCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{tr.nav_prices}</h1>
      <p className="mt-2 text-muted-foreground">{tr.incl_tax}</p>
      <div className="mt-8 overflow-x-auto rounded-2xl bg-card shadow-card">
        <table className="w-full text-left">
          <thead className="bg-muted text-sm"><tr><th className="p-4">{tr.route}</th><th className="p-4">{tr.travel_time}</th>
            {c.classes.map((k) => <th key={k.id} className="p-4">{locName(k, lang)}</th>)}</tr></thead>
          <tbody>
            {c.zones.map((z) => (
              <tr key={z.id} className="border-t">
                <td className="p-4 font-medium">{tr.airport} ↔ {z.name}</td>
                <td className="p-4 text-muted-foreground">{z.duration_min} {tr.min}</td>
                {c.classes.map((k) => {
                  const p = c.pricing.find((x) => x.zone_id === z.id && x.class_id === k.id);
                  return <td key={k.id} className="p-4"><Link to="/$lang/book" params={{ lang }} search={{ zone: z.id, cls: k.id }} className="font-semibold text-primary hover:underline">{p ? `${Number(p.price)} €` : "—"}</Link></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
