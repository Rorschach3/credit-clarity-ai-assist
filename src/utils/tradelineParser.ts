// File: src/utils/tradelineParser.ts
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Zod schemas for validation
export const APITradelineSchema = z.object({
  creditor_name: z.string().min(1, "Creditor name is required"),
  account_number: z.string().min(1, "Account number is required"),
  account_balance: z.string().default("$0"),
  account_status: z.string().min(1, "Account status is required"),
  account_type: z.string().min(1, "Account type is required"),
  date_opened: z.string().default(""),
  is_negative: z.boolean().default(false),
  credit_bureau: z.string().min(1, "Credit bureau is required"),
  dispute_count: z.number().int().min(0).default(0)
});

export const ParsedTradelineSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  user_id: z.string().uuid("Invalid user ID format"),
  creditor_name: z.string().min(1, "Creditor name is required"),
  account_number: z.string().min(1, "Account number is required"),
  account_balance: z.string().default("$0"),
  account_status: z.string().min(1, "Account status is required"),
  account_type: z.string().min(1, "Account type is required"),
  date_opened: z.string().default(""),
  is_negative: z.boolean().default(false),
  credit_bureau: z.string().min(1, "Credit bureau is required"),
  dispute_count: z.number().int().min(0).default(0),
  created_at: z.string().datetime("Invalid datetime format"),
  credit_limit: z.string().default("$0"),
  monthly_payment: z.string().default("$0"),
});

// TypeScript interfaces inferred from Zod schemas
export type APITradeline = z.infer<typeof APITradelineSchema>;
export type ParsedTradeline = z.infer<typeof ParsedTradelineSchema>;

// Negative account indicators
const NEGATIVE_INDICATORS = [
  'charged off', 'charge off', 'collection', 'collections',
  'late', 'delinquent', 'past due', 'default', 'bankruptcy',
  'foreclosure', 'repossession', 'settlement', 'closed', 
  '30-day late', '60-day late', '90-day late', '120-day late'
];

// Generate proper UUID
export const generateUUID = (): string => {
  return uuidv4();
};

// Get user profile ID from auth user ID
export const getUserProfileId = async (authUserId: string): Promise<string | null> => {
  try {
    console.log('[DEBUG] getUserProfileId called with:', authUserId, typeof authUserId);
    
    // Ensure we have a valid string ID
    if (!authUserId || typeof authUserId !== 'string') {
      console.error('[ERROR] Invalid authUserId provided:', authUserId);
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    if (error) {
      console.error('[ERROR] Failed to get user profile ID:', error);
      return null;
    }

    return profile?.id || null;
  } catch (error) {
    console.error('[ERROR] Exception getting user profile ID:', error);
    return null;
  }
};

// Convert API tradeline to database format
export const convertAPITradelineToDatabase = (
  apiTradeline: APITradeline, 
  userProfileId: string,
): ParsedTradeline => {
  // Determine if tradeline is negative
  const isNegative = apiTradeline.is_negative || 
    NEGATIVE_INDICATORS.some(indicator => 
      apiTradeline.account_status.toLowerCase().includes(indicator)
    );

  return {
    id: generateUUID(), // Generate proper UUID
    user_id: userProfileId, // Use profile ID, not auth user ID
    creditor_name: apiTradeline.creditor_name || 'Unknown Creditor',
    account_number: apiTradeline.account_number || 'Unknown',
    account_balance: apiTradeline.account_balance || '$0',
    account_status: apiTradeline.account_status || 'Unknown',
    account_type: apiTradeline.account_type || 'Unknown',
    date_opened: apiTradeline.date_opened || '',
    is_negative: isNegative,
    credit_bureau: apiTradeline.credit_bureau || 'Unknown',
    dispute_count: apiTradeline.dispute_count || 0,
    created_at: new Date().toISOString()
  };
};

// Save tradelines to Supabase database
export const saveTradelinesToDatabase = async (tradelines: ParsedTradeline[], authUserId: string) => {
  try {
    console.log(`[DEBUG] 💾 Saving ${tradelines.length} tradelines to Supabase for user ${authUserId}`);
    
    // ✅ Use authUserId directly instead of getUserProfileId
    const userId = authUserId; // Don't call getUserProfileId
    
    console.log(`[DEBUG] 👤 Using auth user ID directly: ${userId}`);
    
    // Delete existing tradelines
    console.log(`[DEBUG] 🗑️ Deleting existing tradelines for user: ${userId}`);
    const { error: deleteError } = await supabase
      .from('tradelines')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[ERROR] Failed to delete existing tradelines:', deleteError);
      throw deleteError;
    }

    // Insert new tradelines with authUserId
    const tradelinesForDB = tradelines.map(t => ({
      ...t,
      user_id: userId, // Use auth user ID
    }));

    console.log(`[DEBUG] ➕ Inserting ${tradelinesForDB.length} new tradelines`);
    const { data, error: insertError } = await supabase
      .from('tradelines')
      .insert(tradelinesForDB)
      .select();

    if (insertError) {
      console.error('[ERROR] ❌ Failed to save tradelines to Supabase:', insertError);
      throw insertError;
    }

    console.log(`[SUCCESS] ✅ Successfully saved ${data?.length || 0} tradelines`);
    return data;
    
  } catch (error) {
    console.error('[ERROR] ❌ Error in saveTradelinesToDatabase:', error);
    throw error;
  }
};

// Load tradelines from database
export const loadTradelinesFromDatabase = async (authUserId: string): Promise<ParsedTradeline[]> => {
  try {
    // Get user profile ID
    const userProfileId = await getUserProfileId(authUserId);
    if (!userProfileId) {
      console.warn('[WARN] No user profile found for auth user:', authUserId);
      return [];
    }

    console.log(`[DEBUG] 📖 Loading tradelines for profile: ${userProfileId}`);

    // Load tradelines from database
    const { data: tradelines, error } = await supabase
      .from('tradelines')
      .select('*')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ERROR] Failed to load tradelines:', error);
      throw error;
    }

    console.log(`[SUCCESS] ✅ Loaded ${tradelines?.length || 0} tradelines from database`);
    
    return tradelines || [];

  } catch (error) {
    console.error('[ERROR] Error loading tradelines:', error);
    return [];
  }
};

// Get negative tradelines only
export const getNegativeTradelines = (tradelines: ParsedTradeline[]): ParsedTradeline[] => {
  return tradelines.filter(t => 
    t.is_negative || 
    NEGATIVE_INDICATORS.some(indicator => 
      t.account_status.toLowerCase().includes(indicator)
    )
  );
};

// Validate tradeline data
export const validateTradeline = (tradeline: APITradeline): boolean => {
  const required = ['creditor_name', 'account_number', 'account_status'] as const;
  return required.every(field => tradeline[field]?.trim?.().length > 0);
};

// Validate API tradeline with Zod schema
export const validateAPITradeline = (
  tradeline: unknown // strict input
): { success: boolean; data?: APITradeline; error?: string } => {
  try {
    const validated = APITradelineSchema.parse(tradeline);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};

// validate parsed tradeline with Zod schema
export const validateParsedTradeline = (
  tradeline: unknown
): { success: boolean; data?: ParsedTradeline; error?: string } => {
  try {
    const validated = ParsedTradelineSchema.parse(tradeline);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};