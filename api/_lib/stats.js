const MS_PER_DAY = 24 * 60 * 60 * 1000

export const paceMinPerKmFromActivity = (activity) => {
  const distance = Number(activity?.distance_m ?? 0)
  const movingTime = Number(activity?.moving_time_sec ?? 0)
  if (Number.isFinite(distance) && distance > 0 && Number.isFinite(movingTime) && movingTime > 0) {
    return (movingTime * 1000) / distance / 60
  }

  const averageSpeed = Number(activity?.average_speed)
  if (Number.isFinite(averageSpeed) && averageSpeed > 0) {
    return 1000 / averageSpeed / 60
  }

  return null
}

export const summarizeActivities = (activities) => {
  const totals = {
    totalRuns: 0,
    totalDistanceM: 0,
    totalMovingTimeSec: 0,
    totalElevationGainM: 0,
    totalKudos: 0,
    totalAchievements: 0,
    totalPoints: 0,
    longestRunM: 0,
    fastestPaceMinPerKm: null,
    avgPaceMinPerKm: null,
    avgHeartRate: null,
  }

  let heartRateWeightedSum = 0
  let heartRateWeight = 0

  for (const activity of activities) {
    const distance = Number(activity?.distance_m ?? 0)
    const movingTime = Number(activity?.moving_time_sec ?? 0)
    const elevation = Number(activity?.total_elevation_gain ?? 0)
    const kudos = Number(activity?.kudos_count ?? 0)
    const achievements = Number(activity?.achievement_count ?? 0)
    const points = Number(activity?.total_points ?? activity?.activity_scores?.[0]?.total_points ?? 0)

    totals.totalRuns += 1
    if (Number.isFinite(distance)) {
      totals.totalDistanceM += distance
      if (distance > totals.longestRunM) totals.longestRunM = distance
    }
    if (Number.isFinite(movingTime)) totals.totalMovingTimeSec += movingTime
    if (Number.isFinite(elevation)) totals.totalElevationGainM += elevation
    if (Number.isFinite(kudos)) totals.totalKudos += kudos
    if (Number.isFinite(achievements)) totals.totalAchievements += achievements
    if (Number.isFinite(points)) totals.totalPoints += points

    const pace = paceMinPerKmFromActivity(activity)
    if (Number.isFinite(pace)) {
      const distanceOk = Number.isFinite(distance) && distance >= 1000
      if (distanceOk && (totals.fastestPaceMinPerKm === null || pace < totals.fastestPaceMinPerKm)) {
        totals.fastestPaceMinPerKm = pace
      }
    }

    const avgHr = Number(activity?.average_heartrate)
    if (Number.isFinite(avgHr) && avgHr > 0 && Number.isFinite(movingTime) && movingTime > 0) {
      heartRateWeightedSum += avgHr * movingTime
      heartRateWeight += movingTime
    }
  }

  if (totals.totalDistanceM > 0 && totals.totalMovingTimeSec > 0) {
    totals.avgPaceMinPerKm = (totals.totalMovingTimeSec * 1000) / totals.totalDistanceM / 60
  }

  if (heartRateWeight > 0) {
    totals.avgHeartRate = heartRateWeightedSum / heartRateWeight
  }

  return totals
}

export const sliceByDateRange = (activities, start, end) => {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return activities.filter((activity) => {
    const dateValue = activity?.start_date
    const dateMs = dateValue ? new Date(dateValue).getTime() : NaN
    return Number.isFinite(dateMs) && dateMs >= startMs && dateMs < endMs
  })
}

export const buildRollingWeekTrend = ({ activities, end, weeks }) => {
  const results = []
  const endMs = end.getTime()
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const bucketEnd = new Date(endMs - i * 7 * MS_PER_DAY)
    const bucketStart = new Date(bucketEnd.getTime() - 7 * MS_PER_DAY)
    const bucketActivities = sliceByDateRange(activities, bucketStart, bucketEnd)
    const totals = summarizeActivities(bucketActivities)
    results.push({
      start: bucketStart.toISOString(),
      end: bucketEnd.toISOString(),
      label: bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      distanceKm: Number((totals.totalDistanceM / 1000).toFixed(1)),
      avgPaceMinPerKm: totals.avgPaceMinPerKm ? Number(totals.avgPaceMinPerKm.toFixed(2)) : null,
    })
  }
  return results
}

