import { createClient } from '@supabase/supabase-js';

// Try getting keys from process.env (injected by vite config) or import.meta.env (native vite)
const supabaseUrl = process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || (import.meta as any).env?.VITE_SUPABASE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Database features will not work.');
}

// Only create the client if the URL and Key are available.
// Otherwise export null to prevent the "supabaseUrl is required" crash.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;