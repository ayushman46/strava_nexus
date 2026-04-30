const SyncButton = ({ onSync, isLoading }) => (
  <button className="button" onClick={onSync} disabled={isLoading}>
    {isLoading ? 'Syncing...' : 'Sync now'}
  </button>
)

export default SyncButton
