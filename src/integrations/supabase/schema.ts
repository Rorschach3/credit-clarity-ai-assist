
// Define types for our Supabase tables
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  username: string | null;
  website: string | null;
};

export type Dispute = {
  id: string;
  user_id: string;
  credit_bureau: string;
  mailing_address: string;
  letter_content: string;
  status: string;
  shipping_label_url: string | null;
  tracking_number: string | null;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
};

export type Subscriber = {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  created_at: string;
  updated_at: string;
};

// Type-safe table names
export const Tables = {
  profiles: 'profiles',
  disputes: 'disputes',
  user_roles: 'user_roles',
  subscribers: 'subscribers',
} as const;

export type TableName = typeof Tables[keyof typeof Tables];
