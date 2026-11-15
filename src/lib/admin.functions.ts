import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statuses = ["new", "confirmed", "driver_assigned", "on_the_way", "completed", "cancelled"] as const;

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: isStaff } = await sb.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) return { allowed: false as const };
    const [bookings, drivers, assignments] = await Promise.all([
      sb.from("bookings").select("*").order("pickup_at", { ascending: false }).limit(500),
      sb.from("drivers").select("*").order("name"),
      sb.from("driver_assignments").select("*"),
    ]);
    return {
      allowed: true as const,
      bookings: bookings.data ?? [],
      drivers: drivers.data ?? [],
      assignments: assignments.data ?? [],
    };
  });

export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(statuses).optional(),
      price: z.number().min(0).max(10000).optional(),
      driverId: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const patch: { status?: (typeof statuses)[number]; price?: number; updated_at: string } = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.price != null) patch.price = data.price;
    if (data.driverId !== undefined) {
      if (data.driverId) {
        const { error } = await sb.from("driver_assignments").upsert({ booking_id: data.id, driver_id: data.driverId }, { onConflict: "booking_id" });
        if (error) throw new Error(error.message);
        if (!data.status) patch.status = "driver_assigned";
      } else {
        await sb.from("driver_assignments").delete().eq("booking_id", data.id);
      }
    }
    const { error } = await sb.from("bookings").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("audit_log").insert({ actor: context.userId, action: "update", entity: "booking", entity_id: data.id, data });
    return { ok: true };
  });

export const savePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ rows: z.array(z.object({ zone_id: z.string().uuid(), class_id: z.string(), price: z.number().min(0).max(10000) })).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pricing").upsert(data.rows, { onConflict: "zone_id,class_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), price: z.number().min(0).max(1000), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("extras").update({ price: data.price, active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      company_name: z.string().max(200), phone: z.string().max(40), whatsapp: z.string().max(40), email: z.string().email().max(255),
      night_surcharge_pct: z.number().min(0).max(200), holiday_surcharge_pct: z.number().min(0).max(200),
      waiting_per_min: z.number().min(0).max(100), pay_on_arrival: z.boolean(), pay_online: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("settings").update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().min(2).max(100), phone: z.string().max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("drivers").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
