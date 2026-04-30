const AIAdviceCard = ({ report, onRefresh, isLoading }) => (
  <div className="card">
    <div className="card-header">
      <h3>AI coach</h3>
      <button className="button secondary" onClick={onRefresh} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : 'Refresh advice'}
      </button>
    </div>
    {report ? (
      <pre className="ai-output">{report.ai_output}</pre>
    ) : (
      <p className="muted">No AI report yet. Sync your runs to generate advice.</p>
    )}
  </div>
)

export default AIAdviceCard
