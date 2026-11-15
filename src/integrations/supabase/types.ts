export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          data: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          data?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          data?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      bookings: {
        Row: {
          child_babyseats: number
          child_boosters: number
          class_id: string
          code: string
          comments: string | null
          created_at: string
          customer_id: string | null
          destination: string
          direction: string
          email: string
          extra_stops: number
          flight_number: string | null
          id: string
          language: string
          luggage: number
          name: string
          passengers: number
          payment_method: string
          pets: boolean
          phone: string
          pickup: string
          pickup_at: string
          price: number
          price_breakdown: Json
          return_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          child_babyseats?: number
          child_boosters?: number
          class_id: string
          code?: string
          comments?: string | null
          created_at?: string
          customer_id?: string | null
          destination: string
          direction: string
          email: string
          extra_stops?: number
          flight_number?: string | null
          id?: string
          language?: string
          luggage?: number
          name: string
          passengers: number
          payment_method?: string
          pets?: boolean
          phone: string
          pickup: string
          pickup_at: string
          price: number
          price_breakdown?: Json
          return_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          child_babyseats?: number
          child_boosters?: number
          class_id?: string
          code?: string
          comments?: string | null
          created_at?: string
          customer_id?: string | null
          destination?: string
          direction?: string
          email?: string
          extra_stops?: number
          flight_number?: string | null
          id?: string
          language?: string
          luggage?: number
          name?: string
          passengers?: number
          payment_method?: string
          pets?: boolean
          phone?: string
          pickup?: string
          pickup_at?: string
          price?: number
          price_breakdown?: Json
          return_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "vehicle_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          kind: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          kind: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          kind?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      driver_assignments: {
        Row: {
          booking_id: string
          created_at: string
          driver_id: string
          driver_status: string
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          driver_id: string
          driver_status?: string
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          driver_id?: string
          driver_status?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          phone?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      extras: {
        Row: {
          active: boolean
          id: string
          name_en: string
          name_es: string
          name_ru: string
          per_unit: boolean
          price: number
          sort: number
        }
        Insert: {
          active?: boolean
          id: string
          name_en: string
          name_es: string
          name_ru: string
          per_unit?: boolean
          price?: number
          sort?: number
        }
        Update: {
          active?: boolean
          id?: string
          name_en?: string
          name_es?: string
          name_ru?: string
          per_unit?: boolean
          price?: number
          sort?: number
        }
        Relationships: []
      }
      pricing: {
        Row: {
          class_id: string
          id: string
          price: number
          zone_id: string
        }
        Insert: {
          class_id: string
          id?: string
          price: number
          zone_id: string
        }
        Update: {
          class_id?: string
          id?: string
          price?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "vehicle_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          company_name: string
          email: string
          holiday_surcharge_pct: number
          id: number
          night_surcharge_pct: number
          pay_on_arrival: boolean
          pay_online: boolean
          phone: string
          updated_at: string
          waiting_per_min: number
          whatsapp: string
        }
        Insert: {
          company_name?: string
          email?: string
          holiday_surcharge_pct?: number
          id?: number
          night_surcharge_pct?: number
          pay_on_arrival?: boolean
          pay_online?: boolean
          phone?: string
          updated_at?: string
          waiting_per_min?: number
          whatsapp?: string
        }
        Update: {
          company_name?: string
          email?: string
          holiday_surcharge_pct?: number
          id?: number
          night_surcharge_pct?: number
          pay_on_arrival?: boolean
          pay_online?: boolean
          phone?: string
          updated_at?: string
          waiting_per_min?: number
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_classes: {
        Row: {
          active: boolean
          base_fare: number
          id: string
          max_luggage: number
          max_pax: number
          name_en: string
          name_es: string
          name_ru: string
          per_km: number
          sort: number
        }
        Insert: {
          active?: boolean
          base_fare: number
          id: string
          max_luggage: number
          max_pax: number
          name_en: string
          name_es: string
          name_ru: string
          per_km: number
          sort?: number
        }
        Update: {
          active?: boolean
          base_fare?: number
          id?: string
          max_luggage?: number
          max_pax?: number
          name_en?: string
          name_es?: string
          name_ru?: string
          per_km?: number
          sort?: number
        }
        Relationships: []
      }
      zones: {
        Row: {
          distance_km: number
          duration_min: number
          id: string
          intro_en: string
          intro_es: string
          intro_ru: string
          name: string
          popular: boolean
          slug: string
          sort: number
        }
        Insert: {
          distance_km: number
          duration_min: number
          id?: string
          intro_en?: string
          intro_es?: string
          intro_ru?: string
          name: string
          popular?: boolean
          slug: string
          sort?: number
        }
        Update: {
          distance_km?: number
          duration_min?: number
          id?: string
          intro_en?: string
          intro_es?: string
          intro_ru?: string
          name?: string
          popular?: boolean
          slug?: string
          sort?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "driver"
      booking_status:
        | "new"
        | "confirmed"
        | "driver_assigned"
        | "on_the_way"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "driver"],
      booking_status: [
        "new",
        "confirmed",
        "driver_assigned",
        "on_the_way",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
