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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_role_audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          new_active: boolean
          new_role: Database["public"]["Enums"]["app_role"]
          previous_active: boolean
          previous_role: Database["public"]["Enums"]["app_role"]
          reason: string
          target_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          new_active: boolean
          new_role: Database["public"]["Enums"]["app_role"]
          previous_active: boolean
          previous_role: Database["public"]["Enums"]["app_role"]
          reason: string
          target_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          new_active?: boolean
          new_role?: Database["public"]["Enums"]["app_role"]
          previous_active?: boolean
          previous_role?: Database["public"]["Enums"]["app_role"]
          reason?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_audit_logs_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_media: {
        Row: {
          alt_text: string
          caption: string
          case_id: string
          created_at: string
          height: number
          id: string
          is_cover: boolean
          is_public: boolean
          mime_type: string
          mock_asset_key: string | null
          size_bytes: number
          sort_order: number
          stage: Database["public"]["Enums"]["media_stage"]
          storage_path: string | null
          updated_at: string
          upload_status: Database["public"]["Enums"]["upload_status"]
          width: number
        }
        Insert: {
          alt_text?: string
          caption?: string
          case_id: string
          created_at?: string
          height: number
          id?: string
          is_cover?: boolean
          is_public?: boolean
          mime_type: string
          mock_asset_key?: string | null
          size_bytes: number
          sort_order?: number
          stage: Database["public"]["Enums"]["media_stage"]
          storage_path?: string | null
          updated_at?: string
          upload_status?: Database["public"]["Enums"]["upload_status"]
          width: number
        }
        Update: {
          alt_text?: string
          caption?: string
          case_id?: string
          created_at?: string
          height?: number
          id?: string
          is_cover?: boolean
          is_public?: boolean
          mime_type?: string
          mock_asset_key?: string | null
          size_bytes?: number
          sort_order?: number
          stage?: Database["public"]["Enums"]["media_stage"]
          storage_path?: string | null
          updated_at?: string
          upload_status?: Database["public"]["Enums"]["upload_status"]
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_media_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "portfolio_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tags: {
        Row: {
          case_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tags_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "portfolio_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      case_videos: {
        Row: {
          caption: string
          case_id: string
          created_at: string
          id: string
          is_public: boolean
          original_url: string
          sort_order: number
          title: string
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          caption?: string
          case_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          original_url: string
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          caption?: string
          case_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          original_url?: string
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_videos_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "portfolio_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_cases: {
        Row: {
          created_at: string
          created_by: string | null
          display_period: string
          featured_rank: number | null
          id: string
          location_display: string
          privacy_checklist: Json
          problem_description: string
          published_at: string | null
          result_description: string
          seo_description: string | null
          seo_title: string | null
          service_id: string
          slug: string
          space_type: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string
          title: string
          updated_at: string
          updated_by: string | null
          work_date: string | null
          work_description: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_period?: string
          featured_rank?: number | null
          id?: string
          location_display?: string
          privacy_checklist?: Json
          problem_description?: string
          published_at?: string | null
          result_description?: string
          seo_description?: string | null
          seo_title?: string | null
          service_id: string
          slug: string
          space_type?: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          work_date?: string | null
          work_description?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_period?: string
          featured_rank?: number | null
          id?: string
          location_display?: string
          privacy_checklist?: Json
          problem_description?: string
          published_at?: string | null
          result_description?: string
          seo_description?: string | null
          seo_title?: string | null
          service_id?: string
          slug?: string
          space_type?: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          work_date?: string | null
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_cases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_items: {
        Row: {
          conditions: string[]
          created_at: string
          id: string
          name: string
          price_label: string
          service_key: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          conditions?: string[]
          created_at?: string
          id?: string
          name: string
          price_label: string
          service_key: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          conditions?: string[]
          created_at?: string
          id?: string
          name?: string
          price_label?: string
          service_key?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "price_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          cover_asset_key: string
          created_at: string
          description: string
          id: string
          key: string
          name: string
          slug: string
          sort_order: number
          summary: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_asset_key: string
          created_at?: string
          description: string
          id?: string
          key: string
          name: string
          slug: string
          sort_order?: number
          summary: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_asset_key?: string
          created_at?: string
          description?: string
          id?: string
          key?: string
          name?: string
          slug?: string
          sort_order?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          draft: Json
          id: boolean
          published: Json
          published_at: string
          published_by: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          draft: Json
          id?: boolean
          published: Json
          published_at?: string
          published_by?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          draft?: Json
          id?: boolean
          published?: Json
          published_at?: string
          published_by?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_content_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          version: number
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          version: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_content_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key: string
          name: string
          service_id: string
          sort_order: number
          type: Database["public"]["Enums"]["tag_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key: string
          name: string
          service_id: string
          sort_order?: number
          type: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          name?: string
          service_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_portfolio_case: { Args: { case_slug: string }; Returns: Json }
      get_published_site_content: { Args: never; Returns: Json }
      list_admin_profiles: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }[]
      }
      list_public_portfolio_cases: {
        Args: {
          cursor_id?: string
          cursor_published_at?: string
          page_limit?: number
          service_key?: string
          tag_keys?: string[]
        }
        Returns: Json[]
      }
      publish_case: {
        Args: { case_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          display_period: string
          featured_rank: number | null
          id: string
          location_display: string
          privacy_checklist: Json
          problem_description: string
          published_at: string | null
          result_description: string
          seo_description: string | null
          seo_title: string | null
          service_id: string
          slug: string
          space_type: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string
          title: string
          updated_at: string
          updated_by: string | null
          work_date: string | null
          work_description: string
        }
        SetofOptions: {
          from: "*"
          to: "portfolio_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_site_content: { Args: never; Returns: Json }
      restore_site_content_version: {
        Args: { version_id: string }
        Returns: Json
      }
      set_user_admin_role: {
        Args: {
          active: boolean
          new_role: Database["public"]["Enums"]["app_role"]
          reason: string
          target_id: string
        }
        Returns: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_case: {
        Args: { case_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          display_period: string
          featured_rank: number | null
          id: string
          location_display: string
          privacy_checklist: Json
          problem_description: string
          published_at: string | null
          result_description: string
          seo_description: string | null
          seo_title: string | null
          service_id: string
          slug: string
          space_type: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string
          title: string
          updated_at: string
          updated_by: string | null
          work_date: string | null
          work_description: string
        }
        SetofOptions: {
          from: "*"
          to: "portfolio_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unpublish_case: {
        Args: { case_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          display_period: string
          featured_rank: number | null
          id: string
          location_display: string
          privacy_checklist: Json
          problem_description: string
          published_at: string | null
          result_description: string
          seo_description: string | null
          seo_title: string | null
          service_id: string
          slug: string
          space_type: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string
          title: string
          updated_at: string
          updated_by: string | null
          work_date: string | null
          work_description: string
        }
        SetofOptions: {
          from: "*"
          to: "portfolio_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_site_content_draft: { Args: { content: Json }; Returns: Json }
    }
    Enums: {
      app_role: "customer" | "admin" | "super_admin"
      case_status: "private" | "published" | "deleted"
      media_stage: "before" | "process" | "after" | "detail"
      tag_type: "space" | "contamination" | "scope"
      upload_status: "queued" | "uploading" | "ready" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["customer", "admin", "super_admin"],
      case_status: ["private", "published", "deleted"],
      media_stage: ["before", "process", "after", "detail"],
      tag_type: ["space", "contamination", "scope"],
      upload_status: ["queued", "uploading", "ready", "failed"],
    },
  },
} as const
