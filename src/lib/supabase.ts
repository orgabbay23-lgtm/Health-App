import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

/**
 * Calls the atomic RPC `increment_ai_usage` which handles
 * daily midnight resets and returns the new count.
 * Fire-and-forget safe — errors are swallowed with a console warning.
 */
export async function incrementDailyAiUsage(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('increment_ai_usage', { p_user_id: userId });
  if (error) {
    console.warn('[AI Usage] Failed to increment:', error.message);
    return -1;
  }
  return typeof data === 'number' ? data : 0;
}

/**
 * Reads the current daily AI request count from profiles.
 * Returns 0 if last_ai_request_date is not today (pre-reset state).
 * Uses LOCAL date (not UTC) to prevent stale-read edge case where
 * yesterday's maxed quota forces the first request of a new day into fallback.
 */
export async function getDailyAiUsageCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_ai_requests, last_ai_request_date')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return 0;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (data.last_ai_request_date !== today) return 0;

  return data.daily_ai_requests || 0;
}
