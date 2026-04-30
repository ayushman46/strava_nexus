import { useMemo } from 'react'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const formatRangeLabel = (start, end) => {
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${startLabel} → ${endLabel}`
}

const buildWeekOptions = ({ weeks = 16 }) => {
  const endBase = new Date()
  const options = []

  for (let i = 0; i < weeks; i += 1) {
    const end = new Date(endBase.getTime() - i * 7 * MS_PER_DAY)
    const start = new Date(end.getTime() - 7 * MS_PER_DAY)
    const label = i === 0 ? `This week (${formatRangeLabel(start, end)})` : formatRangeLabel(start, end)
    options.push({
      value: i === 0 ? '' : end.toISOString(),
      label,
    })
  }

  return options
}

const WeekSelector = ({ selectedEndIso, onChangeEndIso, weeks = 16 }) => {
  const options = useMemo(() => buildWeekOptions({ weeks }), [weeks])

  const selectedValue = selectedEndIso ?? ''
  const currentIndex = options.findIndex((option) => option.value === selectedValue)
  const selectedIndex = currentIndex >= 0 ? currentIndex : 0

  const goPrev = () => {
    const nextIndex = Math.min(options.length - 1, selectedIndex + 1)
    onChangeEndIso(options[nextIndex].value || null)
  }

  const goNext = () => {
    const nextIndex = Math.max(0, selectedIndex - 1)
    onChangeEndIso(options[nextIndex].value || null)
  }

  return (
    <div className="week-selector">
      <label className="field-label" htmlFor="weekSelect">Week</label>
      <div className="week-controls">
        <button type="button" className="chip-button" onClick={goPrev} disabled={selectedIndex >= options.length - 1}>
          Prev
        </button>
        <select
          id="weekSelect"
          className="field-select"
          value={selectedValue}
          onChange={(event) => onChangeEndIso(event.target.value || null)}
        >
          {options.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="chip-button" onClick={goNext} disabled={selectedIndex <= 0}>
          Next
        </button>
      </div>
    </div>
  )
}

export default WeekSelector

