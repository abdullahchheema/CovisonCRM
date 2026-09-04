/**
 * Hand-authored, PARTIAL Supabase database types — covers only the tables
 * queried by app code so far (profiles, organizations). Cross-checked
 * column-by-column against supabase/migrations/20260904000002_*.sql at the
 * time of writing; not a substitute for the real generator.
 *
 * `supabase gen types typescript --db-url ...` errored in this sandbox
 * (LegacyContainerRuntimeNotFoundError — that CLI path shells out to
 * Docker/Podman even with --db-url, and neither is installed here). Once
 * the project is linked and Docker/Podman is available, replace this file
 * with the real thing and delete this comment:
 *
 *   supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 *
 * Add each new table's Row/Insert/Update here as code starts querying it —
 * or regenerate wholesale once the command above works locally.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          active_organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          active_organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          active_organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["org_role"];
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: Database["public"]["Enums"]["org_role"];
          token_hash: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: Database["public"]["Enums"]["org_role"];
          token_hash: string;
          invited_by?: string | null;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: Database["public"]["Enums"]["org_role"];
          token_hash?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          domain: string | null;
          website: string | null;
          phone: string | null;
          address: Record<string, unknown> | null;
          industry: string | null;
          size: number | null;
          owner_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          domain?: string | null;
          website?: string | null;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          industry?: string | null;
          size?: number | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          domain?: string | null;
          website?: string | null;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          industry?: string | null;
          size?: number | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          company_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          status: string;
          priority: string | null;
          owner_id: string | null;
          expected_revenue: number | null;
          expected_close: string | null;
          probability: string | null;
          linkedin_url: string | null;
          website: string | null;
          country: string | null;
          city: string | null;
          niche: string | null;
          last_activity_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          company_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          status?: string;
          priority?: string | null;
          owner_id?: string | null;
          expected_revenue?: number | null;
          expected_close?: string | null;
          probability?: string | null;
          linkedin_url?: string | null;
          website?: string | null;
          country?: string | null;
          city?: string | null;
          niche?: string | null;
          last_activity_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          company_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          status?: string;
          priority?: string | null;
          owner_id?: string | null;
          expected_revenue?: number | null;
          expected_close?: string | null;
          probability?: string | null;
          linkedin_url?: string | null;
          website?: string | null;
          country?: string | null;
          city?: string | null;
          niche?: string | null;
          last_activity_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          color: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          color?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      contact_tags: {
        Row: {
          contact_id: string;
          tag_id: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          contact_id: string;
          tag_id: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          contact_id?: string;
          tag_id?: string;
          organization_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          body: string | null;
          metadata: Record<string, unknown> | null;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          project_id: string | null;
          actor_id: string | null;
          occurred_at: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          body?: string | null;
          metadata?: Record<string, unknown> | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          project_id?: string | null;
          actor_id?: string | null;
          occurred_at?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          body?: string | null;
          metadata?: Record<string, unknown> | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          project_id?: string | null;
          actor_id?: string | null;
          occurred_at?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      pipelines: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      pipeline_stages: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_id: string;
          name: string;
          position: number;
          probability: number | null;
          color: string | null;
          is_won: boolean;
          is_lost: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_id: string;
          name: string;
          position?: number;
          probability?: number | null;
          color?: string | null;
          is_won?: boolean;
          is_lost?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_id?: string;
          name?: string;
          position?: number;
          probability?: number | null;
          color?: string | null;
          is_won?: boolean;
          is_lost?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          contact_id: string | null;
          company_id: string | null;
          owner_id: string | null;
          name: string;
          value: number;
          currency: string;
          expected_close_date: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_id?: string | null;
          name: string;
          value?: number;
          currency?: string;
          expected_close_date?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_id?: string;
          stage_id?: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_id?: string | null;
          name?: string;
          value?: number;
          currency?: string;
          expected_close_date?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          assigned_to: string | null;
          created_by: string | null;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          project_id: string | null;
          title: string;
          description: string | null;
          priority: string | null;
          status: string;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assigned_to?: string | null;
          created_by?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          project_id?: string | null;
          title: string;
          description?: string | null;
          priority?: string | null;
          status?: string;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          assigned_to?: string | null;
          created_by?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: string | null;
          status?: string;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          organization_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          organization_id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { org_name: string; org_slug: string };
        Returns: Database["public"]["Tables"]["organizations"]["Row"];
      };
      set_active_org: {
        Args: { org: string };
        Returns: void;
      };
      invite_member: {
        Args: { org: string; invite_email: string; invite_role?: Database["public"]["Enums"]["org_role"] };
        Returns: { invitation_id: string; raw_token: string }[];
      };
      accept_invitation: {
        Args: { raw_token: string };
        Returns: Database["public"]["Tables"]["organizations"]["Row"];
      };
    };
    Enums: {
      org_role: "owner" | "admin" | "manager" | "member" | "viewer";
    };
  };
};
