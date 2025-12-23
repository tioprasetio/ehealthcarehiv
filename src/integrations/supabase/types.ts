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
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      control_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          location: string | null;
          notes: string | null;
          patient_id: string;
          scheduled_date: string;
          scheduled_time: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id: string;
          scheduled_date: string;
          scheduled_time: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id?: string;
          scheduled_date?: string;
          scheduled_time?: string;
        };
        Relationships: [];
      };
      daily_health_logs: {
        Row: {
          additional_notes: string | null;
          created_at: string;
          has_dizziness: boolean | null;
          has_nausea: boolean | null;
          has_skin_rash: boolean | null;
          has_weakness: boolean | null;
          id: string;
          log_date: string;
          patient_id: string;
        };
        Insert: {
          additional_notes?: string | null;
          created_at?: string;
          has_dizziness?: boolean | null;
          has_nausea?: boolean | null;
          has_skin_rash?: boolean | null;
          has_weakness?: boolean | null;
          id?: string;
          log_date?: string;
          patient_id: string;
        };
        Update: {
          additional_notes?: string | null;
          created_at?: string;
          has_dizziness?: boolean | null;
          has_nausea?: boolean | null;
          has_skin_rash?: boolean | null;
          has_weakness?: boolean | null;
          id?: string;
          log_date?: string;
          patient_id?: string;
        };
        Relationships: [];
      };
      education_articles: {
        Row: {
          author_id: string | null;
          content: string;
          created_at: string;
          id: string;
          image_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      education_videos: {
        Row: {
          id: string;
          title: string;
          youtube_url: string;
          created_at: string;
          author_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          youtube_url: string;
          created_at?: string;
          author_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          youtube_url?: string;
          created_at?: string;
          author_id?: string | null;
        };
        Relationships: [];
      };
      lab_results: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string;
          patient_id: string;
          test_date: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url: string;
          patient_id: string;
          test_date?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string;
          patient_id?: string;
          test_date?: string;
        };
        Relationships: [];
      };
      medication_logs: {
        Row: {
          id: string;
          patient_id: string;
          schedule_id: string;
          scheduled_date: string;
          taken_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          schedule_id: string;
          scheduled_date?: string;
          taken_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          schedule_id?: string;
          scheduled_date?: string;
          taken_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medication_logs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "medication_schedules";
            referencedColumns: ["id"];
          }
        ];
      };
      medication_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          dosage: string;
          id: string;
          medication_name: string;
          notes: string | null;
          patient_id: string;
          schedule_time: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dosage: string;
          id?: string;
          medication_name: string;
          notes?: string | null;
          patient_id: string;
          schedule_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dosage?: string;
          id?: string;
          medication_name?: string;
          notes?: string | null;
          patient_id?: string;
          schedule_time?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "patient";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

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
    Enums: {
      app_role: ["admin", "patient"],
    },
  },
} as const
