import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Clock, Headphones, ShieldCheck, Star, Users, Briefcase } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ, locName, t, type Lang } from "@/lib/i18n";
import { minPrice } from "@/lib/quote";
import { pageHead } from "@/lib/seo";
import { useCatalog, useLang } from "./$lang";

export const Route = createFileRoute("/$lang/")({
  head: ({ params }) => {
    const tr = t(params.lang as Lang);
    const h = pageHead(params.lang, "", `${tr.brand} — ${tr.hero_title}`, tr.hero_sub);
    return {
      ...h,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: FAQ[params.lang as Lang].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) },
        { type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: tr.brand, areaServed: tr.city, priceRange: "€€" }) },
      ],
    };
  },
  component: Home,
});

function Home() {
  const lang = useLang();
  const tr = t(lang);
  const c = useCatalog();
  const nav = useNavigate();
  const [direction, setDirection] = useState("from_airport");
  const [zone, setZone] = useState(c.zones[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const [pax, setPax] = useState(2);
  const reviews = [
    { n: "Sample review", r: 5, x: "Placeholder — real reviews will appear here." },
    { n: "Sample review", r: 5, x: "Placeholder — real reviews will appear here." },
    { n: "Sample review", r: 5, x: "Placeholder — real reviews will appear here." },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="text-ink-foreground">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">{tr.hero_title}</h1>
            <p className="mt-4 max-w-md text-lg opacity-85">{tr.hero_sub}</p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
              {[[BadgeCheck, tr.badge_licensed], [ShieldCheck, tr.badge_fixed], [Clock, tr.badge_cancel], [Headphones, tr.badge_support]].map(([I, l], i) => {
                const Icon = I as typeof BadgeCheck;
                return <div key={i} className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{l as string}</div>;
              })}
            </div>
          </div>
          <form className="rounded-3xl bg-card p-6 shadow-float" onSubmit={(e) => { e.preventDefault(); nav({ to: "/$lang/book", params: { lang }, search: { direction, zone, when, pax } }); }}>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-sm">
              {(["from_airport", "to_airport", "other"] as const).map((d) => (
                <button type="button" key={d} onClick={() => setDirection(d)}
                  className={`rounded-lg py-2 font-medium ${direction === d ? "bg-card shadow-card text-primary" : "text-muted-foreground"}`}>{tr[d]}</button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium">{tr.area}
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3">
                {c.zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {tr.from} {minPrice(c, z.id)} €</option>)}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">{tr.date_time}
                <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3" />
              </label>
              <label className="block text-sm font-medium">{tr.passengers}
                <input type="number" min={1} max={7} value={pax} onChange={(e) => setPax(+e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3" />
              </label>
            </div>
            <button className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground">{tr.get_price}</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">{tr.how_title}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[[tr.how_1, tr.how_1d], [tr.how_2, tr.how_2d], [tr.how_3, tr.how_3d]].map(([a, b], i) => (
            <div key={i} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft font-bold text-primary">{i + 1}</div>
              <h3 className="mt-4 text-lg font-semibold">{a}</h3><p className="mt-1 text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">{tr.fleet_title}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.classes.map((k) => (
              <div key={k.id} className="rounded-2xl bg-card p-6 shadow-card">
                <h3 className="text-xl font-semibold">{locName(k, lang)}</h3>
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />1–{k.max_pax}</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{k.max_luggage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">{tr.routes_title}</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.zones.filter((z) => z.popular).map((z) => (
            <Link key={z.id} to="/$lang/book" params={{ lang }} search={{ zone: z.id }}
              className="flex items-center justify-between rounded-2xl border bg-card p-5 hover:border-primary">
              <div><div className="font-semibold">{tr.airport} → {z.name}</div><div className="text-sm text-muted-foreground">{z.duration_min} {tr.min}</div></div>
              <div className="text-right text-sm text-muted-foreground">{tr.from}<div className="text-xl font-bold text-primary">{minPrice(c, z.id)} €</div></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">{tr.addons_title}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {c.extras.map((e) => (
              <span key={e.id} className="rounded-full bg-card px-4 py-2 shadow-card">{locName(e, lang)} · <b>{Number(e.price) ? `${e.price} €` : "0 €"}</b></span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">{tr.reviews_title}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex text-primary">{Array.from({ length: r.r }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-3 text-muted-foreground">{r.x}</p><div className="mt-3 text-sm font-semibold">{r.n}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-3xl font-bold">{tr.faq_title}</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQ[lang].map((f, i) => (
            <AccordionItem key={i} value={`f${i}`}><AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
