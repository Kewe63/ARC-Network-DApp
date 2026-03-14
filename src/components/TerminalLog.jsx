import { useRef, useEffect } from 'react'
import { useLang } from '../i18n/LangContext'

export default function TerminalLog({ logs, onClear }) {
  const { t } = useLang()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const colorMap = { info: '#00aa2a', success: '#00ff41', error: '#ff0040', warning: '#ffcc00', system: '#005510' }

  return (
    <section className="card terminal-card">
      <div className="terminal-header">
        <h2 style={{ marginBottom: 0 }}>{t('terminalLog')}</h2>
        <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={onClear}>
          {t('clearLog')}
        </button>
      </div>
      <div className="terminal-body">
        {logs.length === 0 && (
          <span style={{ color: 'var(--text-muted)' }}>// {t('noEvents')}</span>
        )}
        {logs.map(log => (
          <div key={log.id} className="terminal-line">
            <span className="terminal-time">[{log.time}]</span>
            <span className="terminal-type" style={{ color: colorMap[log.type] || '#00ff41' }}>
              [{log.type.toUpperCase()}]
            </span>
            <span className="terminal-msg" style={{ color: colorMap[log.type] || '#00ff41' }}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}
