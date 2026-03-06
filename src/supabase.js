import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdjlcjpbqwwgkdbgvdin.supabase.co'
const supabaseKey = 'sb_publishable_gDlznP0Qv94GqLmLu_rgpw_ktzhoecX'

export const supabase = createClient(supabaseUrl, supabaseKey)