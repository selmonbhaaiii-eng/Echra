export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "client";
export type BusinessPlan = "starter" | "growth" | "agency" | "trial";
export type PlanStatus = "active" | "trial" | "cancelled" | "past_due";
export type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          category: string | null;
          location: string | null;
          gbp_location_id: string | null;
          gbp_connected: boolean | null;
          gbp_account_name: string | null;
          gbp_location_name: string | null;
          google_access_token: string | null;
          google_refresh_token: string | null;
          google_token_expiry: string | null;
          last_review_sync: string | null;
          total_reviews: number | null;
          avg_rating: number | null;
          plan: BusinessPlan | null;
          plan_status: PlanStatus | null;
          health_score: number | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          posts_this_month: number | null;
          monthly_post_limit: number | null;
          business_context: Json | null;
          context_completed: boolean | null;
          context_completion_percent: number | null;
          review_intelligence: Json | null;
          review_intelligence_updated_at: string | null;
          dashboard_actions: Json | null;
          dashboard_actions_updated_at: string | null;
          onboarded_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          category?: string | null;
          location?: string | null;
          gbp_location_id?: string | null;
          gbp_connected?: boolean | null;
          gbp_account_name?: string | null;
          gbp_location_name?: string | null;
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          last_review_sync?: string | null;
          total_reviews?: number | null;
          avg_rating?: number | null;
          plan?: BusinessPlan | null;
          plan_status?: PlanStatus | null;
          health_score?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          posts_this_month?: number | null;
          monthly_post_limit?: number | null;
          business_context?: Json | null;
          context_completed?: boolean | null;
          context_completion_percent?: number | null;
          review_intelligence?: Json | null;
          review_intelligence_updated_at?: string | null;
          dashboard_actions?: Json | null;
          dashboard_actions_updated_at?: string | null;
          onboarded_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          business_id: string | null;
          google_review_id: string | null;
          reviewer_name: string | null;
          reviewer_avatar: string | null;
          rating: number | null;
          review_text: string | null;
          extracted_phrases: Json | null;
          reply_text: string | null;
          replied_at: string | null;
          converted_to_post: boolean | null;
          phrases_extracted: boolean | null;
          post_created: boolean | null;
          post_id: string | null;
          review_date: string | null;
          synced_at: string | null;
          created_at: string | null;
          draft_reply_text: string | null;
          draft_reply_status: "pending" | "approved" | "published" | "failed" | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          business_id: string | null;
          content: string;
          source_type: "review" | "seasonal" | "event" | "manual" | "promo" | null;
          source_review_id: string | null;
          status: PostStatus | null;
          scheduled_at: string | null;
          published_at: string | null;
          gbp_post_id: string | null;
          failed_reason: string | null;
          retry_count: number | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          content: string;
          source_type?: "review" | "seasonal" | "event" | "manual" | "promo" | null;
          source_review_id?: string | null;
          status?: PostStatus | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          gbp_post_id?: string | null;
          failed_reason?: string | null;
          retry_count?: number | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "posts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_source_review_id_fkey";
            columns: ["source_review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_rules: {
        Row: {
          id: string;
          business_id: string | null;
          rule_type:
          | "review_to_post"
          | "seasonal_calendar"
          | "auto_reply"
          | "local_event"
          | "frequency_guard"
          | null;
          is_active: boolean | null;
          config: Json | null;
          last_triggered_at: string | null;
          trigger_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_rules"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["automation_rules"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "automation_rules_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          plan: "starter" | "growth" | "agency";
          status: "active" | "trialing" | "past_due" | "cancelled" | "incomplete";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          plan: "starter" | "growth" | "agency";
          status: "active" | "trialing" | "past_due" | "cancelled" | "incomplete";
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          id: string;
          business_id: string | null;
          error_type: string | null;
          error_message: string | null;
          context: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          error_type?: string | null;
          error_message?: string | null;
          context?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["error_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "error_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_images: {
        Row: {
          id: string;
          business_id: string | null;
          url: string;
          category: "product" | "store" | "staff" | "offer" | null;
          label: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          url: string;
          category?: "product" | "store" | "staff" | "offer" | null;
          label?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["business_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "business_images_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      usage_logs: {
        Row: {
          id: string;
          business_id: string | null;
          action_type: string;
          tokens_used: number | null;
          cost_usd: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          action_type: string;
          tokens_used?: number | null;
          cost_usd?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "usage_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
