import './StatusBar.css'

export default function StatusBar({ status }) {
  if (!status) return null
  const typeMap = { info: 'badge-info', success: 'badge-success', error: 'badge-error', warning: 'badge-warning' }
  return (
    <div className="statusbar">
      <span className={`badge ${typeMap[status.type] || 'badge-info'}`}>
        {status.type.toUpperCase()}
      </span>
      <span className="statusbar-msg">{status.message}</span>
    </div>
  )
}
