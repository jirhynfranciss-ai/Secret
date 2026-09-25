import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In demo mode, we'll use placeholder values and show setup instructions
  console.warn(
    '[Supabase] Environment variables not set. Running in demo mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to Supabase.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://yonlxsighrbpluyewpwt.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvbmx4c2lnaHJicGx1eWV3cHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjgwNDAsImV4cCI6MjEwNTkwNDA0MH0.J6ZEIb9G8g6Kbm5iLteGVMjDswXrEFRvnsk0yV3Qx7U',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
