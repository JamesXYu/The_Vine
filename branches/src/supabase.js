import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://geslegcyixranfmskjfq.supabase.co'
const supabaseAnonKey = 'sb_publishable_i9dggtZali_LYOXMcbqlUg_fali2VpL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
