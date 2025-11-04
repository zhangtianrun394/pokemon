import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please set them in your .env file.')
  }
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export default getSupabaseClient()
