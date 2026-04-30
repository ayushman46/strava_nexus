const paceMultiplier = (paceMinPerKm) => {
  if (!Number.isFinite(paceMinPerKm)) return 1
  if (paceMinPerKm < 4.5) return 1.6
  if (paceMinPerKm < 5) return 1.4
  if (paceMinPerKm < 6) return 1.25
  if (paceMinPerKm < 7) return 1.1
  return 1
}

export const calculateActivityPoints = ({
  distanceM,
  averageSpeed,
  totalElevationGain = 0,
  minDistanceForPaceKm = 2,
}) => {
  const distanceKm = distanceM / 1000
  const basePoints = distanceKm * 10
  const pace = averageSpeed && averageSpeed > 0 ? 1000 / averageSpeed / 60 : null
  const usePace = Number.isFinite(pace) && distanceKm >= minDistanceForPaceKm
  const multiplier = usePace ? paceMultiplier(pace) : 1
  const pacePoints = basePoints * multiplier
  const elevationBonus = Math.floor((totalElevationGain || 0) / 20)
  const totalPoints = Math.round(pacePoints + elevationBonus)

  return {
    distancePoints: basePoints,
    pacePoints,
    elevationPoints: elevationBonus,
    bonusPoints: 0,
    totalPoints,
    pace,
    multiplier,
  }
}
