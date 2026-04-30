import CompareChart from '../components/charts/CompareChart'

const ComparePage = () => {
  const data = [
    { metric: 'Points', you: 80, mate: 72 },
    { metric: 'Distance', you: 60, mate: 55 },
    { metric: 'Pace', you: 70, mate: 62 },
    { metric: 'Runs', you: 65, mate: 58 },
    { metric: 'Elevation', you: 55, mate: 50 },
  ]

  return (
    <div className="page">
      <section className="section">
        <h2>Compare runners</h2>
        <p className="muted">See how you stack up against the group.</p>
        <CompareChart data={data} />
      </section>
    </div>
  )
}

export default ComparePage
