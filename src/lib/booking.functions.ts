import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCatalog } from "./catalog.functions";
import { quote } from "./quote";
import { canCancel } from "./pricing";

const bookingSchema = z.object({
  direction: z.enum(["to_airport", "from_airport", "other"]),
  pickup: z.string().trim().min(2).max(200),
  destination: z.string().trim().min(2).max(200),
  zoneId: z.string().uuid(),
  classId: z.string().min(1).max(40),
  pickupAt: z.string().min(10).max(40),
  returnTrip: z.boolean(),
  returnAt: z.string().max(40).optional().nullable(),
  passengers: z.number().int().min(1).max(7),
  luggage: z.number().int().min(0).max(12),
  extraStops: z.number().int().min(0).max(5),
  flightNumber: z.string().trim().max(12).optional().nullable(),
  boosters: z.number().int().min(0).max(4),
  babySeats: z.number().int().min(0).max(4),
  pets: z.boolean(),
  comments: z.string().trim().max(1000).optional().nullable(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^\+[0-9 ()-]{6,20}$/, "Phone must start with country code, e.g. +34"),
  language: z.enum(["en", "es", "ru"]),
  paymentMethod: z.enum(["arrival", "online"]),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) throw new Error("Rejected");
    const pickupAt = new Date(data.pickupAt);
    if (isNaN(pickupAt.getTime()) || pickupAt.getTime() < Date.now() + 60 * 60 * 1000)
      throw new Error("Pickup time must be at least 1 hour from now");
    let returnAt: Date | null = null;
    if (data.returnTrip) {
      returnAt = data.returnAt ? new Date(data.returnAt) : null;
      if (!returnAt || isNaN(returnAt.getTime()) || returnAt <= pickupAt) throw new Error("Return time must be after pickup");
    }

    const catalog = await loadCatalog();
    const cls = catalog.classes.find((c) => c.id === data.classId);
    if (!cls) throw new Error("Unknown vehicle class");
    if (data.passengers > cls.max_pax) throw new Error(`${cls.name_en} fits up to ${cls.max_pax} passengers`);
    if (data.paymentMethod === "online" && !catalog.settings.pay_online) throw new Error("Online payment is not available");
    const price = quote(catalog, data);
    if (!price) throw new Error("Unknown route");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    // Rate limit: max 3 bookings per email per 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
    if ((count ?? 0) >= 3) throw new Error("Too many bookings, please try again later");

    const { data: cust, error: ce } = await supabaseAdmin
      .from("customers")
      .upsert({ email, name: data.name, phone: data.phone }, { onConflict: "email" })
      .select("id")
      .single();
    if (ce) throw new Error(ce.message);

    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_id: cust.id,
        name: data.name, email, phone: data.phone, language: data.language,
        direction: data.direction, pickup: data.pickup, destination: data.destination,
        zone_id: data.zoneId, class_id: data.classId,
        pickup_at: pickupAt.toISOString(), return_at: returnAt?.toISOString() ?? null,
        passengers: data.passengers, luggage: data.luggage, extra_stops: data.extraStops,
        flight_number: data.flightNumber || null, child_boosters: data.boosters, child_babyseats: data.babySeats,
        pets: data.pets, comments: data.comments || null, payment_method: data.paymentMethod,
        price: price.total, price_breakdown: price,
      })
      .select("code")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({ action: "create", entity: "booking", entity_id: b.code });
    // TODO notifications: customer confirmation email, manager email + Telegram (next phase)
    return { code: b.code, total: price.total };
  });

const lookupSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^BK-\d{4}-\d{6}$/),
  email: z.string().trim().toLowerCase().email().max(255),
});

async function findBooking(code: string, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("code,status,name,pickup,destination,class_id,pickup_at,return_at,passengers,luggage,extra_stops,flight_number,child_boosters,child_babyseats,pets,comments,payment_method,price,phone")
    .eq("code", code)
    .eq("email", email)
    .maybeSingle();
  return { supabaseAdmin, booking: data };
}

export const lookupBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lookupSchema.parse(d))
  .handler(async ({ data }) => {
    const { booking } = await findBooking(data.code, data.email);
    return booking;
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lookupSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, booking } = await findBooking(data.code, data.email);
    if (!booking) throw new Error("Not found");
    if (booking.status === "cancelled" || booking.status === "completed") throw new Error("Booking can't be cancelled");
    if (!canCancel(new Date(booking.pickup_at))) throw new Error("Free cancellation ends 1 hour before pickup");
    await supabaseAdmin.from("bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("code", data.code);
    await supabaseAdmin.from("audit_log").insert({ action: "cancel_by_customer", entity: "booking", entity_id: data.code });
    return { ok: true };
  });

const modifySchema = lookupSchema.extend({
  pickupAt: z.string().min(10).max(40),
  flightNumber: z.string().trim().max(12).optional().nullable(),
  comments: z.string().trim().max(1000).optional().nullable(),
});
export const modifyBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => modifySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, booking } = await findBooking(data.code, data.email);
    if (!booking) throw new Error("Not found");
    if (!canCancel(new Date(booking.pickup_at))) throw new Error("Changes are closed 1 hour before pickup");
    const p = new Date(data.pickupAt);
    if (isNaN(p.getTime()) || p.getTime() < Date.now() + 60 * 60 * 1000) throw new Error("Pickup must be at least 1 hour from now");
    await supabaseAdmin.from("bookings").update({
      pickup_at: p.toISOString(), flight_number: data.flightNumber || null, comments: data.comments || null, updated_at: new Date().toISOString(),
    }).eq("code", data.code);
    await supabaseAdmin.from("audit_log").insert({ action: "modify_by_customer", entity: "booking", entity_id: data.code });
    return { ok: true };
  });
