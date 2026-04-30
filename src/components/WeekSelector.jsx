import { useMemo } from 'react'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const buildCalendarDays = ({ weeks = 4 }) => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Create a linear array of days for the heatmap
  const numDays = weeks * 7
  for (let i = numDays - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * MS_PER_DAY)
    days.push({
      date: d,
      iso: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay(),
      isToday: i === 0,
    })
  }
  return days
}

const WeekSelector = ({ selectedEndIso, onChangeEndIso, activities = [], weeks = 4 }) => {
  const days = useMemo(() => buildCalendarDays({ weeks }), [weeks])

  // Map activities to dates for the heatmap
  const activityMap = useMemo(() => {
    const map = new Set()
    activities.forEach((a) => {
      if (a.start_date) {
        map.add(new Date(a.start_date).toISOString().split('T')[0])
      }
    })
    return map
  }, [activities])

  // Figure out which week the selected date belongs to (or default to current week)
  const selectedDate = selectedEndIso ? new Date(selectedEndIso) : new Date()
  selectedDate.setHours(0, 0, 0, 0)
  
  // Calculate the end of the week for the selected date
  // Calculate the end of the week for the selected date
  // Assuming week ends on current day of week if no selection, or just block by 7 days.
  // Actually, to make it simpler, when clicking a day we just set that day as the "end" date.

  return (
    <div className="calendar-heatmap">
      <div className="heatmap-header">
        <label className="field-label">Activity Heatmap</label>
        <span className="muted" style={{ fontSize: '12px' }}>Click a day to view its week</span>
      </div>
      <div className="heatmap-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${weeks * 7}, 1fr)`,
        gap: '4px',
        marginTop: '8px'
      }}>
        {days.map((day) => {
          const hasActivity = activityMap.has(day.iso)
          const isSelected = selectedEndIso && day.iso === new Date(selectedEndIso).toISOString().split('T')[0]
          
          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => {
                // When a day is clicked, we set the end of the week to this day + any remaining days up to the end of the 7-day period.
                // For simplicity, we can just pass this day as the new "end" date.
                const newEnd = new Date(day.date)
                newEnd.setHours(23, 59, 59, 999)
                onChangeEndIso(newEnd.toISOString())
              }}
              title={`${day.date.toLocaleDateString()} ${hasActivity ? '(Ran)' : ''}`}
              className={`heatmap-day ${hasActivity ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: hasActivity 
                  ? (isSelected ? '#22c55e' : 'rgba(34, 197, 94, 0.5)')
                  : (isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                border: isSelected ? '1px solid #fff' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            />
          )
        })}
      </div>
      {selectedEndIso && (
        <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">
            Week ending: <strong style={{ color: '#fff' }}>{new Date(selectedEndIso).toLocaleDateString()}</strong>
          </span>
          <button 
            type="button" 
            onClick={() => onChangeEndIso(null)}
            style={{ color: '#a78bfa', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Reset to Today
          </button>
        </div>
      )}
    </div>
  )
}

export default WeekSelector
