import 'dotenv/config'
import { getSupabaseAdmin } from './api/_lib/supabase.js'
const supabase = getSupabaseAdmin()
async function test() {
  const { data, error } = await supabase.from('activities').select('id, distance_m, moving_time_sec, elapsed_time_sec, total_elevation_gain, average_speed, average_heartrate, activity_scores(total_points), kudos_count, achievement_count')
  console.log('Error?', error)
  console.log('Data len:', data?.length)
}
test()
