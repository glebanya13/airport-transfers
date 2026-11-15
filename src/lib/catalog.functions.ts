import { supabase } from "@/integrations/supabase/client";

export type Catalog = {
  classes: Array<{
    id: string;
    sort: number;
    name_en: string;
    name_es: string;
    name_ru: string;
    max_pax: number;
    max_luggage: number;
    per_km: string | number;
    base_fare: string | number;
    active: boolean;
  }>;
  zones: Array<{
    id: string;
    slug: string;
    name: string;
    distance_km: string | number;
    duration_min: number;
    intro_en: string;
    intro_es: string;
    intro_ru: string;
    popular: boolean;
    sort: number;
  }>;
  pricing: Array<{
    id: string;
    zone_id: string;
    class_id: string;
    price: string | number;
  }>;
  extras: Array<{
    id: string;
    name_en: string;
    name_es: string;
    name_ru: string;
    price: string | number;
    per_unit: boolean;
    active: boolean;
    sort: number;
  }>;
  settings: {
    id: number;
    company_name: string;
    phone: string;
    whatsapp: string;
    email: string;
    night_surcharge_pct: string | number;
    holiday_surcharge_pct: string | number;
    waiting_per_min: string | number;
    pay_on_arrival: boolean;
    pay_online: boolean;
    updated_at: string;
  };
};

let cachedCatalog: Catalog | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cachedCatalog) return cachedCatalog;
  const [classes, zones, pricing, extras, settings] = await Promise.all([
    supabase.from("vehicle_classes").select("*").eq("active", true).order("sort"),
    supabase.from("zones").select("*").order("sort"),
    supabase.from("pricing").select("*"),
    supabase.from("extras").select("*").eq("active", true).order("sort"),
    supabase.from("settings").select("*").eq("id", 1).single(),
  ]);
  for (const r of [classes, zones, pricing, extras, settings]) {
    if (r.error) throw new Error(r.error.message);
  }
  cachedCatalog = {
    classes: classes.data as any,
    zones: zones.data as any,
    pricing: pricing.data as any,
    extras: extras.data as any,
    settings: settings.data as any,
  };
  return cachedCatalog;
}

export const getCatalog = async (): Promise<Catalog> => loadCatalog();
