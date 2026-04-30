import { useState, useMemo } from 'react'

const MonthCalendar = ({ activities, onSelectDate, selectedEndIso }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedEndIso || new Date()))

  const activeDates = useMemo(() => {
    const dates = new Set()
    activities.forEach(activity => {
      if (activity?.start_date) {
        const iso = new Date(activity.start_date).toISOString().split('T')[0]
        dates.add(iso)
      }
    })
    return dates
  }, [activities])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // Determine the currently selected week range to highlight
  let selectedStart = null
  let selectedEnd = null
  if (selectedEndIso) {
    const end = new Date(selectedEndIso)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    selectedStart = start.getTime()
    selectedEnd = end.getTime()
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d)
    const isoString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    
    const hasActivity = activeDates.has(isoString)
    const isToday = new Date().toISOString().split('T')[0] === isoString

    const dateTime = dateObj.getTime()
    const isSelectedWeek = selectedStart && dateTime >= selectedStart && dateTime <= selectedEnd

    days.push(
      <button 
        key={d} 
        className={`calendar-day ${hasActivity ? 'active-day' : ''} ${isToday ? 'today' : ''} ${isSelectedWeek ? 'selected-week' : ''}`}
        onClick={() => onSelectDate && onSelectDate(dateObj)}
        title={hasActivity ? 'You ran on this day!' : ''}
      >
        {d}
      </button>
    )
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="icon-button calendar-nav">←</button>
        <span className="calendar-title">{monthNames[month]} {year}</span>
        <button onClick={handleNextMonth} className="icon-button calendar-nav">→</button>
      </div>
      <div className="calendar-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {days}
      </div>
      {selectedEndIso && (
        <div className="calendar-footer">
          Showing week ending: <strong>{new Date(selectedEndIso).toLocaleDateString()}</strong>
          <button className="chip-button" onClick={() => onSelectDate && onSelectDate(new Date())} style={{ marginLeft: '12px' }}>
            Reset
          </button>
        </div>
      )}
      <style>{`
        .calendar-widget {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .calendar-title {
          font-weight: 900;
          font-size: 1.2rem;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .calendar-nav {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 8px 14px;
          transition: background 0.2s var(--ease), transform 0.2s var(--ease);
        }
        .calendar-nav:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .calendar-weekday {
          text-align: center;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          padding-bottom: 8px;
          font-weight: 800;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.02);
          color: rgba(234, 242, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s var(--ease);
        }
        .calendar-day:not(.empty):hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
        .calendar-day.selected-week {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .calendar-day.active-day {
          background: rgba(34, 197, 94, 0.15);
          color: var(--accent-2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          box-shadow: 0 0 16px rgba(34, 197, 94, 0.1);
        }
        .calendar-day.active-day:hover {
          background: rgba(34, 197, 94, 0.25);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
        }
        .calendar-day.selected-week.active-day {
          background: rgba(34, 197, 94, 0.35);
          border-color: var(--accent-2);
          box-shadow: 0 0 24px rgba(34, 197, 94, 0.3);
        }
        .calendar-day.today {
          border-color: rgba(255, 255, 255, 0.4);
        }
        .calendar-day.empty {
          background: transparent;
          cursor: default;
        }
        .calendar-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: 0.85rem;
          color: var(--muted);
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  )
}

export default MonthCalendar
