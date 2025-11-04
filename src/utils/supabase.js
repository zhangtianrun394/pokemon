import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase