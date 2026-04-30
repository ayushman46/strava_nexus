import 'dotenv/config'
import { getSupabaseAdmin } from './api/_lib/supabase.js'
const supabase = getSupabaseAdmin()
async function test() {
  const { data, error } = await supabase.from('activities').select('id, name, moving_time_sec, elapsed_time_sec')
  console.log('Total activities:', data?.length)
  const nullElapsed = data?.filter(a => !a.elapsed_time_sec)?.length
  console.log('Activities with null elapsed_time_sec:', nullElapsed)
}
test()
