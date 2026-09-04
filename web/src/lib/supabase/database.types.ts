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
    };
    Enums: {
      org_role: "owner" | "admin" | "manager" | "member" | "viewer";
    };
  };
};
