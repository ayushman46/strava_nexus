export const metersToKm = (meters, digits = 1) => {
  if (meters === null || meters === undefined) return null
  const km = meters / 1000
  return Number.isFinite(km) ? Number(km.toFixed(digits)) : null
}

export const secondsToHms = (seconds) => {
  if (!Number.isFinite(seconds)) return null
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const parts = []
  if (hrs > 0) parts.push(`${hrs}h`)
  parts.push(`${String(mins).padStart(2, '0')}m`)
  parts.push(`${String(secs).padStart(2, '0')}s`)
  return parts.join(' ')
}

export const paceFromSpeed = (averageSpeed) => {
  if (!Number.isFinite(averageSpeed) || averageSpeed <= 0) return null
  return 1000 / averageSpeed / 60
}

export const formatPace = (pace) => {
  if (!Number.isFinite(pace)) return '—'
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
