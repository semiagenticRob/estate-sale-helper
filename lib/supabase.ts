import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://fuwofqvgfkuxldtitxzx.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_rix2fE9lbm9vMxtllc6cVA_kPAYdYII';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
