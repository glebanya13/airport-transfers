import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { createBooking } from "@/lib/booking.functions";
import { locName, t, type Lang } from "@/lib/i18n";
import { quote } from "@/lib/quote";
import { pageHead } from "@/lib/seo";
import { useCatalog, useLang } from "./$lang";

const search = z.object({
  direction: z.enum(["to_airport", "from_airport", "other"]).optional().catch(undefined),
  zone: z.string().optional().catch(undefined),
  cls: z.string().optional().catch(undefined),
  when: z.string().optional().catch(undefined),
  pax: z.coerce.number().optional().catch(undefined),
});

export const Route = createFileRoute("/$lang/book")({
  validateSearch: search,
  head: ({ params }) => {
    const tr = t(params.lang as Lang);
    return pageHead(params.lang, "/book", `${tr.nav_book} — ${tr.brand}`, tr.hero_sub);
  },
  component: BookPage,
});

const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5";
const label = "block text-sm font-medium";

function BookPage() {
  const lang = useLang();
  const tr = t(lang);
  const c = useCatalog();
  const s = Route.useSearch();
  const submit = useServerFn(createBooking);
  const [f, setF] = useState({
    direction: s.direction ?? "from_airport",
    pickup: "", destination: "",
    zoneId: s.zone && c.zones.some((z) => z.id === s.zone) ? s.zone : (c.zones[0]?.id ?? ""),
    classId: s.cls ?? "economy",
    pickupAt: s.when ?? "", returnTrip: false, returnAt: "",
    passengers: s.pax ?? 2, luggage: 2, extraStops: 0, flightNumber: "",
    boosters: 0, babySeats: 0, pets: false, comments: "",
    name: "", email: "", phone: "+", paymentMethod: "arrival" as "arrival" | "online", website: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const zone = c.zones.find((z) => z.id === f.zoneId)!;
  const price = useMemo(() => quote(c, f), [c, f]);
  const airport = `${tr.airport}`;
  const pickupDefault = f.direction === "from_airport" ? airport : "";
  const destDefault = f.direction === "to_airport" ? airport : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await submit({
        data: {
          ...f,
          pickup: f.pickup || pickupDefault || zone.name,
          destination: f.destination || destDefault || zone.name,
          pickupAt: new Date(f.pickupAt).toISOString(),
          returnAt: f.returnTrip && f.returnAt ? new Date(f.returnAt).toISOString() : null,
          language: lang,
        },
      });
      setDone(r);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 text-3xl font-bold">{tr.booking_ok}</h1>
        <p className="mt-2 text-muted-foreground">{tr.booking_ok_sub}</p>
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-card">
          <div className="text-sm text-muted-foreground">{tr.booking_code}</div>
          <div className="font-display text-3xl font-bold tracking-wide">{done.code}</div>
          <div className="mt-2 text-lg">{tr.total}: <b>{done.total} €</b></div>
        </div>
        <Link to="/$lang/my-booking" params={{ lang }} search={{ code: done.code, email: f.email }} className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">{tr.manage}</Link>
      </div>
    );
  }

  const cls = c.classes.find((k) => k.id === f.classId);
  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{tr.nav_book}</h1>
        <section className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-sm">
            {(["from_airport", "to_airport", "other"] as const).map((d) => (
              <button type="button" key={d} onClick={() => set("direction", d)}
                className={`rounded-lg py-2 font-medium ${f.direction === d ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}>{tr[d]}</button>
            ))}
          </div>
          <label className={label}>{tr.area}
            <select className={input} value={f.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
              {c.zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.distance_km} km)</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>{tr.pickup}<input className={input} value={f.pickup} placeholder={pickupDefault || "Street, number, hotel…"} onChange={(e) => set("pickup", e.target.value)} /></label>
            <label className={label}>{tr.destination}<input className={input} value={f.destination} placeholder={destDefault || "Street, number, hotel…"} onChange={(e) => set("destination", e.target.value)} /></label>
            <label className={label}>{tr.date_time}<input required type="datetime-local" className={input} value={f.pickupAt} onChange={(e) => set("pickupAt", e.target.value)} /></label>
            <label className={label}>{tr.flight}<input className={input} value={f.flightNumber} maxLength={12} onChange={(e) => set("flightNumber", e.target.value.toUpperCase())} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.returnTrip} onChange={(e) => set("returnTrip", e.target.checked)} /> {tr.return_trip}</label>
          {f.returnTrip && <label className={label}>{tr.return_date}<input required type="datetime-local" className={input} value={f.returnAt} onChange={(e) => set("returnAt", e.target.value)} /></label>}
        </section>

        <section className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
          <div className="text-sm font-medium">{tr.vehicle}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {c.classes.map((k) => {
              const q = quote(c, { ...f, classId: k.id });
              const tooSmall = f.passengers > k.max_pax;
              return (
                <button type="button" key={k.id} disabled={tooSmall} onClick={() => set("classId", k.id)}
                  className={`rounded-xl border-2 p-4 text-left disabled:opacity-40 ${f.classId === k.id ? "border-primary bg-primary-soft" : "border-border"}`}>
                  <div className="flex justify-between font-semibold"><span>{locName(k, lang)}</span><span className="text-primary">{q?.total} €</span></div>
                  <div className="text-sm text-muted-foreground">1–{k.max_pax} {tr.pax} · {k.max_luggage} {tr.bags}</div>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {([["passengers", tr.passengers, 1, 7], ["luggage", tr.luggage, 0, 12], ["extraStops", tr.extra_stops, 0, 5], ["boosters", tr.boosters, 0, 4], ["babySeats", tr.babyseats, 0, 4]] as const).map(([k, l, mn, mx]) => (
              <label key={k} className={label}>{l}<input type="number" min={mn} max={mx} className={input} value={f[k]} onChange={(e) => set(k, Math.max(mn, Math.min(mx, +e.target.value)))} /></label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.pets} onChange={(e) => set("pets", e.target.checked)} /> {tr.pets}</label>
          <label className={label}>{tr.comments}<textarea className={input} maxLength={1000} rows={3} value={f.comments} onChange={(e) => set("comments", e.target.value)} /></label>
        </section>

        <section className="grid gap-4 rounded-2xl bg-card p-6 shadow-card sm:grid-cols-3">
          <label className={label}>{tr.name}<input required maxLength={100} className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className={label}>{tr.email}<input required type="email" maxLength={255} className={input} value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label className={label}>{tr.phone}<input required type="tel" pattern="\+[0-9 ()\-]{6,20}" className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} name="website" />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <div className="text-sm text-muted-foreground">{tr.route}</div>
          <div className="font-semibold">{f.direction === "to_airport" ? `${zone.name} → ${tr.airport}` : `${tr.airport} → ${zone.name}`}</div>
          <div className="mt-1 text-sm text-muted-foreground">{cls && locName(cls, lang)} · {zone.duration_min} {tr.min}{f.returnTrip ? ` · ×2` : ""}</div>
          <div className="mt-4 text-sm font-medium">{tr.payment}</div>
          {c.settings.pay_on_arrival && <label className="mt-2 flex items-center gap-2 text-sm"><input type="radio" checked={f.paymentMethod === "arrival"} onChange={() => set("paymentMethod", "arrival")} /> {tr.pay_arrival}</label>}
          {c.settings.pay_online && <label className="mt-1 flex items-center gap-2 text-sm"><input type="radio" checked={f.paymentMethod === "online"} onChange={() => set("paymentMethod", "online")} /> {tr.pay_online}</label>}
          <div className="mt-5 border-t pt-4">
            <div className="text-sm text-muted-foreground">{tr.total}</div>
            <div className="font-display text-4xl font-bold">{price?.total ?? "—"} €</div>
            <div className="text-xs text-muted-foreground">{tr.incl_tax}</div>
          </div>
          {err && <p role="alert" className="mt-3 text-sm text-destructive">{err}</p>}
          <button disabled={busy} className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "…" : tr.book_now}</button>
          <p className="mt-3 text-center text-xs text-muted-foreground">{tr.cancel_note}</p>
        </div>
      </aside>
    </form>
  );
}
