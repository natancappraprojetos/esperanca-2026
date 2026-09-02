// Auto-generated types from database schema
// Run: npx supabase gen types typescript --local > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          website: string | null
          contact_email: string | null
          status: 'active' | 'inactive' | 'suspended'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          organization_id: string | null
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          role: 'super_admin' | 'admin_general' | 'church_admin' | 'viewer'
          status: 'active' | 'inactive' | 'suspended'
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      states: {
        Row: {
          id: string
          name: string
          uf: string
          ibge_code: number | null
          region: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['states']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['states']['Insert']>
      }
      cities: {
        Row: {
          id: string
          organization_id: string | null
          state_id: string
          name: string
          slug: string
          ibge_code: number | null
          latitude: number | null
          longitude: number | null
          status: 'active' | 'inactive'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cities']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['cities']['Insert']>
      }
      neighborhoods: {
        Row: {
          id: string
          city_id: string
          name: string
          name_normalized: string
          geometry: unknown | null
          centroid: unknown | null
          latitude: number | null
          longitude: number | null
          source: 'ibge_2022' | 'prefecture' | 'manual' | 'imported'
          source_code: string | null
          data_version: string | null
          imported_at: string | null
          population_estimate: number | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['neighborhoods']['Row'], 'id' | 'name_normalized' | 'created_at' | 'updated_at'> & { id?: string; name_normalized?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['neighborhoods']['Insert']>
      }
      churches: {
        Row: {
          id: string
          organization_id: string
          city_id: string
          pastor_id: string | null
          name: string
          slug: string
          address_street: string | null
          address_number: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_cep: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          website: string | null
          location: unknown | null
          latitude: number | null
          longitude: number | null
          schedules: Json
          pixel_config: Json
          status: 'active' | 'inactive' | 'draft'
          is_demo: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['churches']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['churches']['Insert']>
      }
      pastors: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          photo_url: string | null
          bio: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pastors']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['pastors']['Insert']>
      }
      church_neighborhoods: {
        Row: {
          id: string
          church_id: string
          neighborhood_id: string
          assignment_type: 'manual' | 'auto'
          priority: number
          assigned_by: string | null
          assigned_at: string
        }
        Insert: Omit<Database['public']['Tables']['church_neighborhoods']['Row'], 'id' | 'assigned_at'> & { id?: string; assigned_at?: string }
        Update: Partial<Database['public']['Tables']['church_neighborhoods']['Insert']>
      }
      geographic_rules: {
        Row: {
          id: string
          neighborhood_id: string
          church_id: string
          previous_church_id: string | null
          reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['geographic_rules']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['geographic_rules']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          theme: string | null
          tagline: string | null
          description: string | null
          starts_at: string | null
          ends_at: string | null
          cover_image_url: string | null
          cover_image_mobile_url: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          ga4_measurement_id: string | null
          gtm_container_id: string | null
          google_ads_id: string | null
          status: 'draft' | 'active' | 'paused' | 'ended'
          is_default: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      banners: {
        Row: {
          id: string
          church_id: string | null
          campaign_id: string | null
          name: string
          image_desktop_url: string | null
          image_mobile_url: string | null
          display_order: number
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['banners']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['banners']['Insert']>
      }
      digital_materials: {
        Row: {
          id: string
          campaign_id: string | null
          organization_id: string | null
          name: string
          slug: string
          description: string | null
          offer_headline: string | null
          offer_text: string | null
          cover_image_url: string | null
          file_url: string | null
          file_size_bytes: number | null
          file_mime_type: string
          display_order: number
          requires_lead: boolean
          status: 'active' | 'inactive' | 'draft'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['digital_materials']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['digital_materials']['Insert']>
      }
      material_downloads: {
        Row: {
          id: string
          material_id: string
          lead_id: string | null
          campaign_id: string | null
          church_id: string | null
          city_id: string | null
          session_token: string | null
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          downloaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['material_downloads']['Row'], 'id' | 'downloaded_at'> & { id?: string; downloaded_at?: string }
        Update: Partial<Database['public']['Tables']['material_downloads']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          whatsapp: string
          whatsapp_raw: string | null
          full_name: string | null
          status: 'active' | 'blocked' | 'unsubscribed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      leads: {
        Row: {
          id: string
          contact_id: string
          campaign_id: string
          church_id: string | null
          city_id: string | null
          neighborhood_id: string | null
          material_id: string | null
          church_assignment_method: 'manual' | 'auto' | 'proximity' | 'fallback' | 'direct' | null
          landing_page: string | null
          funnel_step_completed: string | null
          ip_address: string | null
          user_agent: string | null
          device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown' | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          utm_session_id: string | null
          referrer_url: string | null
          status: 'active' | 'invalid' | 'blocked' | 'duplicate'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      lead_consents: {
        Row: {
          id: string
          lead_id: string
          contact_id: string
          consent_data: boolean
          consent_data_at: string | null
          policy_version: string
          policy_url: string | null
          consent_reminder_whatsapp: boolean
          consent_reminder_at: string | null
          consent_ip: string | null
          consent_user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lead_consents']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['lead_consents']['Insert']>
      }
      tracking_pixels: {
        Row: {
          id: string
          organization_id: string | null
          scope: 'global' | 'campaign' | 'city' | 'church'
          campaign_id: string | null
          city_id: string | null
          church_id: string | null
          pixel_type: 'meta' | 'ga4' | 'gtm' | 'google_ads' | 'custom'
          pixel_id: string
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tracking_pixels']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['tracking_pixels']['Insert']>
      }
      funnel_events: {
        Row: {
          id: string
          session_token: string | null
          lead_id: string | null
          campaign_id: string | null
          city_id: string | null
          church_id: string | null
          neighborhood_id: string | null
          event_name: string
          event_properties: Json
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          occurred_at: string
        }
        Insert: Omit<Database['public']['Tables']['funnel_events']['Row'], 'id' | 'occurred_at'> & { id?: string; occurred_at?: string }
        Update: Partial<Database['public']['Tables']['funnel_events']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          action: string
          entity_type: string
          entity_id: string | null
          entity_name: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          user_agent: string | null
          occurred_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'occurred_at'> & { id?: string; occurred_at?: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      search_neighborhoods: {
        Args: {
          p_city_id: string
          p_query: string
          p_limit?: number
          p_threshold?: number
        }
        Returns: {
          id: string
          name: string
          name_normalized: string
          score: number
          latitude: number | null
          longitude: number | null
        }[]
      }
      find_church_for_neighborhood: {
        Args: {
          p_neighborhood_id: string
          p_campaign_id?: string
        }
        Returns: {
          church_id: string
          church_name: string
          assignment_method: string
          distance_meters: number | null
        }[]
      }
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_admin_or_higher: {
        Args: Record<string, never>
        Returns: boolean
      }
      has_permission: {
        Args: { p_permission_name: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Domain types
export type Organization = Tables<'organizations'>
export type UserProfile = Tables<'user_profiles'>
export type State = Tables<'states'>
export type City = Tables<'cities'>
export type Neighborhood = Tables<'neighborhoods'>
export type Church = Tables<'churches'>
export type Pastor = Tables<'pastors'>
export type Campaign = Tables<'campaigns'>
export type Banner = Tables<'banners'>
export type DigitalMaterial = Tables<'digital_materials'>
export type Lead = Tables<'leads'>
export type Contact = Tables<'contacts'>
export type LeadConsent = Tables<'lead_consents'>
export type TrackingPixel = Tables<'tracking_pixels'>
export type FunnelEvent = Tables<'funnel_events'>
export type AuditLog = Tables<'audit_logs'>

// Extended types with joins
export type ChurchWithPastor = Church & {
  pastor: Pastor | null
  city: City
}

export type LeadWithDetails = Lead & {
  contact: Contact
  church: Church | null
  city: City | null
  neighborhood: Neighborhood | null
  campaign: Campaign
  consent: LeadConsent | null
}

export type CampaignWithStats = Campaign & {
  leads_count: number
  downloads_count: number
  churches_count: number
  cities_count: number
}
