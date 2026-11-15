import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { cancelBooking, lookupBooking, modifyBooking } from "@/lib/booking.functions";
import { t, type Lang } from "@/lib/i18n";
import { canCancel } from "@/lib/pricing";
import { pageHead } from "@/lib/seo";
import { useLang } from "./$lang";

export const Route = createFileRoute("/$lang/my-booking")({
  validateSearch: z.object({ code: z.string().optional().catch(undefined), email: z.string().optional().catch(undefined) }),
  head: ({ params }) => {
    const tr = t(params.lang as Lang);
    return pageHead(params.lang, "/my-booking", `${tr.nav_my} — ${tr.brand}`, tr.cancel_note);
  },
  component: MyBooking,
});

type B = NonNullable<Awaited<ReturnType<typeof lookupBooking>>>;
const toLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function MyBooking() {
  const lang = useLang();
  const tr = t(lang);
  const s = Route.useSearch();
  const [code, setCode] = useState(s.code ?? "");
  const [email, setEmail] = useState(s.email ?? "");
  const [b, setB] = useState<B | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState({ pickupAt: "", flightNumber: "", comments: "" });
  const lookup = useServerFn(lookupBooking);
  const cancel = useServerFn(cancelBooking);
  const modify = useServerFn(modifyBooking);

  async function find() {
    setMsg(null);
    try {
      const r = await lookup({ data: { code, email } });
      setB(r ?? null);
      if (!r) setMsg(tr.not_found);
      else setEdit({ pickupAt: toLocal(r.pickup_at), flightNumber: r.flight_number ?? "", comments: r.comments ?? "" });
    } catch { setMsg(tr.not_found); }
  }
  useEffect(() => { if (s.code && s.email) find(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn: () => Promise<unknown>) {
    setMsg(null);
    try { await fn(); await find(); } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5";
  const open = b && b.status !== "cancelled" && b.status !== "completed" && canCancel(new Date(b.pickup_at));
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">{tr.nav_my}</h1>
      <form className="mt-6 space-y-3 rounded-2xl bg-card p-6 shadow-card" onSubmit={(e) => { e.preventDefault(); find(); }}>
        <label className="block text-sm font-medium">{tr.booking_code}<input required className={input} placeholder="BK-2026-000123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
        <label className="block text-sm font-medium">{tr.email}<input required type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">{tr.lookup}</button>
      </form>
      {msg && <p role="alert" className="mt-4 text-destructive">{msg}</p>}
      {b && (
        <div className="mt-6 space-y-3 rounded-2xl bg-card p-6 shadow-card">
          <div className="flex items-center justify-between"><span className="font-display text-xl font-bold">{b.code}</span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">{tr[`st_${b.status}` as keyof typeof tr]}</span></div>
          <div>{b.pickup} → {b.destination}</div>
          <div className="text-muted-foreground">{new Date(b.pickup_at).toLocaleString(lang)} · {b.passengers} {tr.pax}</div>
          <div className="text-xl font-bold">{Number(b.price)} €</div>
          {open && (
            <div className="space-y-3 border-t pt-4">
              <label className="block text-sm font-medium">{tr.date_time}<input type="datetime-local" className={input} value={edit.pickupAt} onChange={(e) => setEdit({ ...edit, pickupAt: e.target.value })} /></label>
              <label className="block text-sm font-medium">{tr.flight}<input className={input} value={edit.flightNumber} onChange={(e) => setEdit({ ...edit, flightNumber: e.target.value })} /></label>
              <label className="block text-sm font-medium">{tr.comments}<textarea className={input} value={edit.comments} onChange={(e) => setEdit({ ...edit, comments: e.target.value })} /></label>
              <div className="flex gap-3">
                <button type="button" onClick={() => run(() => modify({ data: { code, email, ...edit, pickupAt: new Date(edit.pickupAt).toISOString() } }))} className="flex-1 rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground">{tr.continue}</button>
                <button type="button" onClick={() => confirm(tr.cancel_booking + "?") && run(() => cancel({ data: { code, email } }))} className="flex-1 rounded-xl border border-destructive py-2.5 font-semibold text-destructive">{tr.cancel_booking}</button>
              </div>
              <p className="text-xs text-muted-foreground">{tr.cancel_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
