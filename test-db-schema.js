import 'dotenv/config'
import { getSupabaseAdmin } from './api/_lib/supabase.js'
const supabase = getSupabaseAdmin()
async function test() {
  const { data, error } = await supabase.from('activities').select('*').limit(1)
  console.log(error || Object.keys(data[0]))
}
test()
