import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  dotenv.config({ path: resolve(__dirname, '../../../.env') });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('\n  [admin] Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set.');
    console.error('  Copy Admin/.env.example → Admin/.env and fill in your Supabase credentials.\n');
    process.exit(1);
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
