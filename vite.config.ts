import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Prioritize variables loaded by Vite, fallback to process.env for Vercel system variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || process.env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || process.env.SUPABASE_KEY),
    },
  };
});