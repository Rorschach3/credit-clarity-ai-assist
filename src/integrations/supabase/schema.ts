
import { Database } from "./types";

// Define types for our Supabase tables
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Dispute = Database['public']['Tables']['disputes']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Subscriber = Database['public']['Tables']['subscribers']['Row'];

// Type-safe table names
export const Tables = {
  profiles: 'profiles',
  disputes: 'disputes',
  user_roles: 'user_roles',
  subscribers: 'subscribers',
} as const;

export type TableName = typeof Tables[keyof typeof Tables];

// Extend Subscriber type with additional fields that might be added as the app evolves
export interface SubscriberWithFeatures extends Subscriber {
  maximum_dispute_letters?: number;
  includes_creditor_disputes?: boolean;
}
