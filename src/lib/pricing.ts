// Pure price engine — shared by browser (live quote) and server (authoritative price).
export type PriceInput = {
  fixedPrice: number | null; // from pricing table (zone x class)
  distanceKm: number; // fallback distance
  baseFare: number;
  perKm: number;
  waitingPerMin: number;
  waitingMin?: number;
  extraStops: number;
  extraStopPrice: number;
  babySeats: number;
  babySeatPrice: number;
  boosters: number;
  boosterPrice: number;
  pets: boolean;
  petPrice: number;
  returnTrip: boolean;
  surchargePct: number; // night/holiday, applied to the whole total
};

export type PriceBreakdown = {
  base: number;
  extras: number;
  leg: number;
  legs: number;
  surcharge: number;
  total: number;
  usedFallback: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcPrice(i: PriceInput): PriceBreakdown {
  const usedFallback = i.fixedPrice == null;
  const base = usedFallback
    ? i.baseFare + i.perKm * i.distanceKm + i.waitingPerMin * (i.waitingMin ?? 0)
    : (i.fixedPrice as number);
  const extras =
    i.extraStops * i.extraStopPrice +
    i.babySeats * i.babySeatPrice +
    i.boosters * i.boosterPrice +
    (i.pets ? i.petPrice : 0);
  const leg = base + extras;
  const legs = i.returnTrip ? 2 : 1;
  const sub = leg * legs;
  const surcharge = sub * (i.surchargePct / 100);
  return {
    base: r2(base),
    extras: r2(extras),
    leg: r2(leg),
    legs,
    surcharge: r2(surcharge),
    total: Math.round(sub + surcharge),
    usedFallback,
  };
}

export function isNightHour(d: Date) {
  const h = d.getHours();
  return h >= 22 || h < 6;
}

// Free cancellation until 1 hour before pickup.
export function canCancel(pickupAt: Date, now = new Date()) {
  return pickupAt.getTime() - now.getTime() > 60 * 60 * 1000;
}
