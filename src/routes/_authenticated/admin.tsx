import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDriver, getAdminData, saveExtra, savePricing, saveSettings, updateBooking } from "@/lib/admin.functions";
import { getCatalog } from "@/lib/catalog.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Airport Transfers" }, { name: "description", content: "Bookings admin panel." }, { property: "og:title", content: "Admin" }, { property: "og:description", content: "Bookings admin panel." }, { name: "robots", content: "noindex" }] }),
  loader: async () => ({ admin: await getAdminData(), catalog: await getCatalog() }),
  component: Admin,
});

const STATUSES = ["new", "confirmed", "driver_assigned", "on_the_way", "completed", "cancelled"] as const;
const input = "rounded-lg border bg-background px-2 py-1.5 text-sm";

function Admin() {
  const { admin, catalog } = Route.useLoaderData();
  const router = useRouter();
  const refresh = () => router.invalidate();
  if (!admin.allowed)
    return <div className="p-10">Your account has no staff role. Ask an admin to grant access. <button className="text-primary" onClick={() => supabase.auth.signOut().then(() => router.navigate({ to: "/auth" }))}>Sign out</button></div>;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button className="text-sm text-primary" onClick={() => supabase.auth.signOut().then(() => router.navigate({ to: "/auth" }))}>Sign out</button>
      </div>
      <Tabs defaultValue="bookings" className="mt-6">
        <TabsList><TabsTrigger value="bookings">Bookings</TabsTrigger><TabsTrigger value="stats">Stats</TabsTrigger><TabsTrigger value="pricing">Pricing</TabsTrigger><TabsTrigger value="extras">Extras</TabsTrigger><TabsTrigger value="drivers">Drivers</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
        <TabsContent value="bookings"><Bookings data={admin} refresh={refresh} /></TabsContent>
        <TabsContent value="stats"><Stats bookings={admin.bookings} /></TabsContent>
        <TabsContent value="pricing"><Pricing catalog={catalog} refresh={refresh} /></TabsContent>
        <TabsContent value="extras"><Extras catalog={catalog} refresh={refresh} /></TabsContent>
        <TabsContent value="drivers"><Drivers drivers={admin.drivers} refresh={refresh} /></TabsContent>
        <TabsContent value="settings"><Settings catalog={catalog} refresh={refresh} /></TabsContent>
      </Tabs>
    </div>
  );
}

type AdminOk = Extract<Awaited<ReturnType<typeof getAdminData>>, { allowed: true }>;
type Cat = Awaited<ReturnType<typeof getCatalog>>;

function Bookings({ data, refresh }: { data: AdminOk; refresh: () => void }) {
  const upd = useServerFn(updateBooking);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const rows = useMemo(() => data.bookings.filter((b) =>
    (!st || b.status === st) && (!q || `${b.code} ${b.name} ${b.email} ${b.phone} ${b.destination}`.toLowerCase().includes(q.toLowerCase()))), [data, q, st]);
  const driverOf = (id: string) => data.assignments.find((a) => a.booking_id === id)?.driver_id ?? "";
  const act = async (d: { id: string; status?: (typeof STATUSES)[number]; price?: number; driverId?: string | null }) => { await upd({ data: d }); refresh(); };

  function csv() {
    const head = ["code", "status", "pickup_at", "name", "email", "phone", "pickup", "destination", "class", "pax", "price"];
    const lines = rows.map((b) => [b.code, b.status, b.pickup_at, b.name, b.email, b.phone, b.pickup, b.destination, b.class_id, b.passengers, b.price].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "bookings.csv" }).click();
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <input className={input} placeholder="Search code, name, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <button onClick={csv} className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Export CSV</button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>{["Code", "Pickup", "Customer", "Route", "Class", "Price €", "Status", "Driver"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t align-top">
                <td className="p-3 font-mono">{b.code}</td>
                <td className="p-3">{new Date(b.pickup_at).toLocaleString()}{b.flight_number && <div className="text-muted-foreground">{b.flight_number}</div>}</td>
                <td className="p-3">{b.name}<div className="text-muted-foreground">{b.email}<br />{b.phone}</div></td>
                <td className="p-3">{b.pickup} → {b.destination}<div className="text-muted-foreground">{b.passengers} pax · {b.luggage} bags{b.return_at ? " · return" : ""}</div></td>
                <td className="p-3">{b.class_id}</td>
                <td className="p-3"><input type="number" defaultValue={Number(b.price)} className={`${input} w-20`} onBlur={(e) => +e.target.value !== Number(b.price) && act({ id: b.id, price: +e.target.value })} /></td>
                <td className="p-3"><select className={input} value={b.status} onChange={(e) => act({ id: b.id, status: e.target.value as (typeof STATUSES)[number] })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                <td className="p-3"><select className={input} value={driverOf(b.id)} onChange={(e) => act({ id: b.id, driverId: e.target.value || null })}><option value="">—</option>{data.drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stats({ bookings }: { bookings: AdminOk["bookings"] }) {
  const byDay = new Map<string, { n: number; rev: number }>();
  for (const b of bookings) {
    const d = b.created_at.slice(0, 10);
    const cur = byDay.get(d) ?? { n: 0, rev: 0 };
    cur.n++; if (b.status !== "cancelled") cur.rev += Number(b.price);
    byDay.set(d, cur);
  }
  const rev = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + Number(b.price), 0);
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-card"><div className="text-sm text-muted-foreground">Bookings</div><div className="text-3xl font-bold">{bookings.length}</div></div>
        <div className="rounded-xl bg-card p-5 shadow-card"><div className="text-sm text-muted-foreground">Revenue (excl. cancelled)</div><div className="text-3xl font-bold">{rev} €</div></div>
        <div className="rounded-xl bg-card p-5 shadow-card"><div className="text-sm text-muted-foreground">New</div><div className="text-3xl font-bold">{bookings.filter((b) => b.status === "new").length}</div></div>
      </div>
      <table className="w-full rounded-xl bg-card text-sm shadow-card"><thead className="bg-muted text-left"><tr><th className="p-3">Day</th><th className="p-3">Bookings</th><th className="p-3">Revenue €</th></tr></thead>
        <tbody>{[...byDay.entries()].sort().reverse().map(([d, v]) => <tr key={d} className="border-t"><td className="p-3">{d}</td><td className="p-3">{v.n}</td><td className="p-3">{v.rev}</td></tr>)}</tbody></table>
    </div>
  );
}

function Pricing({ catalog, refresh }: { catalog: Cat; refresh: () => void }) {
  const save = useServerFn(savePricing);
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(catalog.pricing.map((p) => [`${p.zone_id}|${p.class_id}`, Number(p.price)])));
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-4 overflow-x-auto rounded-xl bg-card p-4 shadow-card">
      <table className="text-sm"><thead><tr><th className="p-2 text-left">Zone</th>{catalog.classes.map((c) => <th key={c.id} className="p-2">{c.name_en}</th>)}</tr></thead>
        <tbody>{catalog.zones.map((z) => (
          <tr key={z.id}><td className="p-2">{z.name}</td>{catalog.classes.map((c) => {
            const k = `${z.id}|${c.id}`;
            return <td key={c.id} className="p-2"><input type="number" className={`${input} w-24`} value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: +e.target.value })} /></td>;
          })}</tr>))}</tbody></table>
      <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={async () => {
        await save({ data: { rows: Object.entries(vals).map(([k, price]) => { const [zone_id, class_id] = k.split("|"); return { zone_id, class_id, price }; }) } });
        setOk(true); refresh();
      }}>Save prices</button>{ok && <span className="ml-3 text-sm text-success">Saved</span>}
    </div>
  );
}

function Extras({ catalog, refresh }: { catalog: Cat; refresh: () => void }) {
  const save = useServerFn(saveExtra);
  return (
    <div className="mt-4 space-y-2 rounded-xl bg-card p-4 shadow-card">
      {catalog.extras.map((e) => (
        <div key={e.id} className="flex items-center gap-3 text-sm">
          <span className="w-48">{e.name_en}</span>
          <input type="number" defaultValue={Number(e.price)} className={`${input} w-24`} onBlur={(ev) => save({ data: { id: e.id, price: +ev.target.value, active: e.active } }).then(refresh)} /> €
        </div>
      ))}
    </div>
  );
}

function Drivers({ drivers, refresh }: { drivers: AdminOk["drivers"]; refresh: () => void }) {
  const add = useServerFn(addDriver);
  const [n, setN] = useState(""); const [p, setP] = useState("");
  return (
    <div className="mt-4 space-y-3 rounded-xl bg-card p-4 shadow-card">
      {drivers.map((d) => <div key={d.id} className="text-sm">{d.name} · {d.phone}</div>)}
      <div className="flex gap-2"><input className={input} placeholder="Name" value={n} onChange={(e) => setN(e.target.value)} /><input className={input} placeholder="Phone" value={p} onChange={(e) => setP(e.target.value)} />
        <button className="rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground" onClick={() => add({ data: { name: n, phone: p } }).then(() => { setN(""); setP(""); refresh(); })}>Add driver</button></div>
    </div>
  );
}

function Settings({ catalog, refresh }: { catalog: Cat; refresh: () => void }) {
  const save = useServerFn(saveSettings);
  const s = catalog.settings;
  const [f, setF] = useState({ company_name: s.company_name, phone: s.phone, whatsapp: s.whatsapp, email: s.email,
    night_surcharge_pct: Number(s.night_surcharge_pct), holiday_surcharge_pct: Number(s.holiday_surcharge_pct), waiting_per_min: Number(s.waiting_per_min),
    pay_on_arrival: s.pay_on_arrival, pay_online: s.pay_online });
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-4 grid max-w-xl gap-3 rounded-xl bg-card p-4 text-sm shadow-card">
      {(["company_name", "phone", "whatsapp", "email"] as const).map((k) => <label key={k}>{k}<input className={`${input} w-full`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}
      {(["night_surcharge_pct", "holiday_surcharge_pct", "waiting_per_min"] as const).map((k) => <label key={k}>{k}<input type="number" className={`${input} w-full`} value={f[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} /></label>)}
      <label className="flex gap-2"><input type="checkbox" checked={f.pay_on_arrival} onChange={(e) => setF({ ...f, pay_on_arrival: e.target.checked })} /> Pay driver on arrival</label>
      <label className="flex gap-2"><input type="checkbox" checked={f.pay_online} onChange={(e) => setF({ ...f, pay_online: e.target.checked })} /> Online card payment (requires Stripe setup)</label>
      <button className="rounded-lg bg-primary py-2 font-semibold text-primary-foreground" onClick={() => save({ data: f }).then(() => { setOk(true); refresh(); })}>Save settings</button>
      {ok && <span className="text-success">Saved</span>}
    </div>
  );
}
