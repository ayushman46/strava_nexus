import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LeaderboardTable from '../components/LeaderboardTable'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

const GroupPage = () => {
  const { groupId } = useParams()
  const [range, setRange] = useState('weekly')
  const [data, setData] = useState({ loading: true, error: null, rows: [] })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setData((prev) => ({ ...prev, loading: true }))
      try {
        const response = await fetch(`/api/leaderboard?groupId=${groupId}&range=${range}`)
        if (!response.ok) throw new Error('Failed')
        const payload = await response.json()
        if (isMounted) setData({ loading: false, error: null, rows: payload.rows })
      } catch (error) {
        if (isMounted) setData({ loading: false, error, rows: [] })
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [groupId, range])

  if (data.loading) return <LoadingSpinner />
  if (data.error) return <ErrorState message="Unable to load leaderboard." />

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Group leaderboard</h2>
            <p className="muted">Invite teammates using your group code.</p>
          </div>
          <div className="segmented">
            {['weekly', 'monthly', 'all-time'].map((value) => (
              <button
                key={value}
                className={range === value ? 'button' : 'button secondary'}
                onClick={() => setRange(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <LeaderboardTable rows={data.rows} />
      </section>
    </div>
  )
}

export default GroupPage
