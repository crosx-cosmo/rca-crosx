export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      redirect_analyses: {
        Row: {
          created_at: string;
          final_status: number | null;
          final_url: string | null;
          id: string;
          issue_count: number;
          redirect_loop: boolean;
          result: Json;
          start_url: string;
          total_hops: number;
          total_redirects: number;
          total_response_time_ms: number;
        };
        Insert: {
          created_at?: string;
          final_status?: number | null;
          final_url?: string | null;
          id?: string;
          issue_count?: number;
          redirect_loop?: boolean;
          result: Json;
          start_url: string;
          total_hops?: number;
          total_redirects?: number;
          total_response_time_ms?: number;
        };
        Update: {
          created_at?: string;
          final_status?: number | null;
          final_url?: string | null;
          id?: string;
          issue_count?: number;
          redirect_loop?: boolean;
          result?: Json;
          start_url?: string;
          total_hops?: number;
          total_redirects?: number;
          total_response_time_ms?: number;
        };
        Relationships: [];
      };
      short_links: {
        Row: {
          clicks: number;
          created_at: string;
          destination: string;
          enabled: boolean;
          expires_at: string | null;
          id: string;
          last_clicked_at: string | null;
          owner_hash: string;
          slug: string;
        };
        Insert: {
          clicks?: number;
          created_at?: string;
          destination: string;
          enabled?: boolean;
          expires_at?: string | null;
          id?: string;
          last_clicked_at?: string | null;
          owner_hash: string;
          slug: string;
        };
        Update: {
          clicks?: number;
          created_at?: string;
          destination?: string;
          enabled?: boolean;
          expires_at?: string | null;
          id?: string;
          last_clicked_at?: string | null;
          owner_hash?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _sl_hash: { Args: { token: string }; Returns: string };
      create_short_link: {
        Args: { p_destination: string; p_owner: string; p_slug: string };
        Returns: {
          clicks: number;
          created_at: string;
          destination: string;
          enabled: boolean;
          expires_at: string | null;
          id: string;
          last_clicked_at: string | null;
          owner_hash: string;
          slug: string;
        };
        SetofOptions: {
          from: "*";
          to: "short_links";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      delete_short_link: {
        Args: { p_id: string; p_owner: string };
        Returns: boolean;
      };
      list_short_links: {
        Args: { p_owner: string };
        Returns: {
          clicks: number;
          created_at: string;
          destination: string;
          enabled: boolean;
          expires_at: string | null;
          id: string;
          last_clicked_at: string | null;
          owner_hash: string;
          slug: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "short_links";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      resolve_short_link: { Args: { p_slug: string }; Returns: string };
      set_short_link_enabled: {
        Args: { p_enabled: boolean; p_id: string; p_owner: string };
        Returns: boolean;
      };
      set_short_link_expiry: {
        Args: { p_expires_at: string; p_id: string; p_owner: string };
        Returns: boolean;
      };
      update_short_link_destination: {
        Args: { p_destination: string; p_id: string; p_owner: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
