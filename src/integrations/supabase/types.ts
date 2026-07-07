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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          contact: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          recipient: string
          related_order_id: string | null
          related_request_id: string | null
          status: string
          subject: string
          template: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          related_order_id?: string | null
          related_request_id?: string | null
          status?: string
          subject: string
          template?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          related_order_id?: string | null
          related_request_id?: string | null
          status?: string
          subject?: string
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          span: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          span?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          span?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          comment: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_cost: number | null
          delivery_days: string | null
          delivery_external_id: string | null
          delivery_method: string
          delivery_payload: Json | null
          delivery_provider: string | null
          delivery_tracking: string | null
          id: string
          items: Json
          payment_id: string | null
          payment_method: string
          payment_status: string | null
          payment_url: string | null
          refunded_amount: number | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_cost?: number | null
          delivery_days?: string | null
          delivery_external_id?: string | null
          delivery_method: string
          delivery_payload?: Json | null
          delivery_provider?: string | null
          delivery_tracking?: string | null
          id?: string
          items?: Json
          payment_id?: string | null
          payment_method: string
          payment_status?: string | null
          payment_url?: string | null
          refunded_amount?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_cost?: number | null
          delivery_days?: string | null
          delivery_external_id?: string | null
          delivery_method?: string
          delivery_payload?: Json | null
          delivery_provider?: string | null
          delivery_tracking?: string | null
          id?: string
          items?: Json
          payment_id?: string | null
          payment_method?: string
          payment_status?: string | null
          payment_url?: string | null
          refunded_amount?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_log: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          error: string | null
          event: string
          id: string
          order_id: string | null
          order_key: string | null
          payment_id: string | null
          provider: string
          raw_request: Json | null
          raw_response: Json | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          error?: string | null
          event: string
          id?: string
          order_id?: string | null
          order_key?: string | null
          payment_id?: string | null
          provider?: string
          raw_request?: Json | null
          raw_response?: Json | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          error?: string | null
          event?: string
          id?: string
          order_id?: string | null
          order_key?: string | null
          payment_id?: string | null
          provider?: string
          raw_request?: Json | null
          raw_response?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          show_in_menu: boolean
          show_on_home: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          show_in_menu?: boolean
          show_on_home?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          show_in_menu?: boolean
          show_on_home?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          ar_glb_url: string | null
          ar_usdz_url: string | null
          area_m2: number | null
          brand: string | null
          category: string
          coating: string | null
          country: string | null
          created_at: string
          depth_cm: number | null
          description: string | null
          discount_percent: number
          height_cm: number | null
          id: string
          images: string[]
          is_active: boolean
          manufacturer: string | null
          material: string | null
          name: string
          options: Json
          package_info: string | null
          price: number
          sku: string | null
          sort_order: number
          stock_status: string | null
          updated_at: string
          volume_m3: number | null
          weight_gross_kg: number | null
          weight_kg: number | null
          width_cm: number | null
          wood_species: string | null
        }
        Insert: {
          ar_glb_url?: string | null
          ar_usdz_url?: string | null
          area_m2?: number | null
          brand?: string | null
          category: string
          coating?: string | null
          country?: string | null
          created_at?: string
          depth_cm?: number | null
          description?: string | null
          discount_percent?: number
          height_cm?: number | null
          id?: string
          images?: string[]
          is_active?: boolean
          manufacturer?: string | null
          material?: string | null
          name: string
          options?: Json
          package_info?: string | null
          price?: number
          sku?: string | null
          sort_order?: number
          stock_status?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_gross_kg?: number | null
          weight_kg?: number | null
          width_cm?: number | null
          wood_species?: string | null
        }
        Update: {
          ar_glb_url?: string | null
          ar_usdz_url?: string | null
          area_m2?: number | null
          brand?: string | null
          category?: string
          coating?: string | null
          country?: string | null
          created_at?: string
          depth_cm?: number | null
          description?: string | null
          discount_percent?: number
          height_cm?: number | null
          id?: string
          images?: string[]
          is_active?: boolean
          manufacturer?: string | null
          material?: string | null
          name?: string
          options?: Json
          package_info?: string | null
          price?: number
          sku?: string | null
          sort_order?: number
          stock_status?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_gross_kg?: number | null
          weight_kg?: number | null
          width_cm?: number | null
          wood_species?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          requirements: string | null
          salary: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_unpaid_orders: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
