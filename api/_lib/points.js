export const calculateActivityPoints = ({
  distance_m,
  average_speed,
  total_elevation_gain,
}) => {
  const distanceKm = distance_m / 1000
  const basePoints = distanceKm * 10
  const pace = average_speed && average_speed > 0 ? 1000 / average_speed / 60 : null
  const eligibleForPace = pace && distanceKm >= 2
  let multiplier = 1
  if (eligibleForPace) {
    if (pace < 4.5) multiplier = 1.6
    else if (pace < 5) multiplier = 1.4
    else if (pace < 6) multiplier = 1.25
    else if (pace < 7) multiplier = 1.1
  }
  const pacePoints = basePoints * multiplier
  const elevationPoints = Math.floor((total_elevation_gain || 0) / 20)
  const totalPoints = Math.round(pacePoints + elevationPoints)
  return {
    distance_points: basePoints,
    pace_points: pacePoints,
    elevation_points: elevationPoints,
    bonus_points: 0,
    total_points: totalPoints,
    pace,
  }
}
