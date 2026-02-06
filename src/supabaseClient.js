
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// anon key（PUBLISHABLE_KEY または ANON_KEY のどちらか）
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// 接続確認用
// console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key:', supabaseKey ? '設定済み' : '未設定');
export const supabase = createClient(supabaseUrl, supabaseKey);
