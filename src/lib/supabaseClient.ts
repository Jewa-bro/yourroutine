import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in the environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// 임시 export (앱의 다른 부분에서 임포트 오류가 나지 않도록) 