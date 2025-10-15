/**
 * Database type definitions
 * Generated from Supabase schema
 *
 * To regenerate: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string | null;
          subscription_tier: string;
          api_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name?: string | null;
          subscription_tier?: string;
          api_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string | null;
          subscription_tier?: string;
          api_key?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mcp_servers: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          version: string;
          owner_id: string | null;
          is_official: boolean;
          hosting_type: string;
          callback_url: string | null;
          webhook_secret: string | null;
          status: string;
          health_status: string;
          last_health_check: string | null;
          tags: string[] | null;
          logo_url: string | null;
          documentation_url: string | null;
          install_count: number;
          request_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          version?: string;
          owner_id?: string | null;
          is_official?: boolean;
          hosting_type: string;
          callback_url?: string | null;
          webhook_secret?: string | null;
          status?: string;
          health_status?: string;
          last_health_check?: string | null;
          tags?: string[] | null;
          logo_url?: string | null;
          documentation_url?: string | null;
          install_count?: number;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          version?: string;
          owner_id?: string | null;
          is_official?: boolean;
          hosting_type?: string;
          callback_url?: string | null;
          webhook_secret?: string | null;
          status?: string;
          health_status?: string;
          last_health_check?: string | null;
          tags?: string[] | null;
          logo_url?: string | null;
          documentation_url?: string | null;
          install_count?: number;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mcp_tools: {
        Row: {
          id: string;
          server_id: string;
          name: string;
          description: string | null;
          parameters: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          name: string;
          description?: string | null;
          parameters: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          name?: string;
          description?: string | null;
          parameters?: Json;
          created_at?: string;
        };
      };
      user_mcp_installations: {
        Row: {
          id: string;
          user_id: string;
          server_id: string;
          config: Json;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          server_id: string;
          config?: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          server_id?: string;
          config?: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
