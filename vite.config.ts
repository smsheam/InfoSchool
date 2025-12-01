import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Prioritize variables loaded by Vite, fallback to process.env for Vercel system variables.
      // We check for both standard names and VITE_ prefixed names to be safe.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY),
      
      'process.env.SUPABASE_URL': JSON.stringify(
        env.SUPABASE_URL || process.env.SUPABASE_URL || 
        env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
      ),
      
      'process.env.SUPABASE_KEY': JSON.stringify(
        env.SUPABASE_KEY || process.env.SUPABASE_KEY || 
        env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY ||
        env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
      ),
    },
  };
});