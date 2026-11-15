import { describe, expect, it } from "vitest";
import { calcPrice, canCancel } from "./pricing";

const base = {
  fixedPrice: 40, distanceKm: 20, baseFare: 25, perKm: 1.1, waitingPerMin: 0.5,
  extraStops: 0, extraStopPrice: 10, babySeats: 0, babySeatPrice: 5, boosters: 0, boosterPrice: 0,
  pets: false, petPrice: 10, returnTrip: false, surchargePct: 0,
};

describe("price engine", () => {
  it("uses the fixed price from the pricing table", () => {
    expect(calcPrice(base).total).toBe(40);
  });
  it("charges €10 per extra stop", () => {
    expect(calcPrice({ ...base, extraStops: 2 }).total).toBe(60);
  });
  it("return trip charges both legs", () => {
    expect(calcPrice({ ...base, extraStops: 1, returnTrip: true }).total).toBe(100);
  });
  it("falls back to base + €/km when no fixed price", () => {
    expect(calcPrice({ ...base, fixedPrice: null }).total).toBe(47);
  });
  it("default surcharge is 0, configurable surcharge applies", () => {
    expect(calcPrice({ ...base, surchargePct: 25 }).total).toBe(50);
  });
});

describe("cancellation", () => {
  const now = new Date("2026-01-01T10:00:00Z");
  it("free until 1h before pickup", () => {
    expect(canCancel(new Date("2026-01-01T11:30:00Z"), now)).toBe(true);
    expect(canCancel(new Date("2026-01-01T10:45:00Z"), now)).toBe(false);
  });
});
