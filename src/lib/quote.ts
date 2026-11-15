import { calcPrice, isNightHour } from "./pricing";
import type { Catalog } from "./catalog.functions";

export type QuoteForm = {
  zoneId: string;
  classId: string;
  pickupAt: string;
  returnTrip: boolean;
  extraStops: number;
  boosters: number;
  babySeats: number;
  pets: boolean;
};

export function quote(c: Catalog, f: QuoteForm) {
  const zone = c.zones.find((z) => z.id === f.zoneId);
  const cls = c.classes.find((k) => k.id === f.classId);
  if (!zone || !cls) return null;
  const fixed = c.pricing.find((p) => p.zone_id === zone.id && p.class_id === cls.id);
  const ex = (id: string) => Number(c.extras.find((e) => e.id === id)?.price ?? 0);
  const d = f.pickupAt ? new Date(f.pickupAt) : new Date();
  const surchargePct = isNightHour(d) ? Number(c.settings.night_surcharge_pct) : 0;
  return calcPrice({
    fixedPrice: fixed ? Number(fixed.price) : null,
    distanceKm: Number(zone.distance_km),
    baseFare: Number(cls.base_fare),
    perKm: Number(cls.per_km),
    waitingPerMin: Number(c.settings.waiting_per_min),
    extraStops: f.extraStops,
    extraStopPrice: ex("extra_stop"),
    babySeats: f.babySeats,
    babySeatPrice: ex("baby_seat"),
    boosters: f.boosters,
    boosterPrice: ex("booster"),
    pets: f.pets,
    petPrice: ex("pet"),
    returnTrip: f.returnTrip,
    surchargePct,
  });
}

export function minPrice(c: Catalog, zoneId: string) {
  const ps = c.pricing.filter((p) => p.zone_id === zoneId).map((p) => Number(p.price));
  return ps.length ? Math.min(...ps) : null;
}
