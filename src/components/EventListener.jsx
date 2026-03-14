import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { Contract } from 'ethers'

export default function EventListener({ deployedAddress, abi, signer }) {
  const { t } = useLang()
  const [events, setEvents] = useState([])
  const [listening, setListening] = useState(false)
  const [contractRef, setContractRef] = useState(null)

  const start = () => {
    if (!signer || !deployedAddress || !abi) return
    const c = new Contract(deployedAddress, abi, signer)
    c.on('*', (event) => {
      setEvents(prev => [{
        name: event.eventName ?? 'Event',
        args: JSON.stringify(event.args ?? {}, (_, v) => typeof v === 'bigint' ? v.toString() : v),
        time: new Date().toLocaleTimeString(),
      }, ...prev.slice(0, 49)])
    })
    setContractRef(c)
    setListening(true)
  }

  const stop = () => {
    contractRef?.removeAllListeners()
    setListening(false)
  }

  return (
    <div className="interaction-block">
      <h3 className="fn-name">{t('events')} <span className={`badge ${listening ? 'badge-success' : 'badge-info'}`}>{listening ? t('eventLive') : t('eventOff')}</span></h3>
      <div style={{ marginBottom: '0.75rem' }}>
        {!listening
          ? <button className="btn btn-secondary" onClick={start}>{t('listenEvents')}</button>
          : <button className="btn btn-danger" onClick={stop}>{t('stopEvents')}</button>
        }
      </div>
      {events.length === 0
        ? <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t('noEvents')}</span>
        : (
          <div className="event-list">
            {events.map((e, i) => (
              <div key={i} className="event-item">
                <span className="badge badge-info">{e.name}</span>
                <span className="tx-time">{e.time}</span>
                <code style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.72rem', wordBreak: 'break-all' }}>{e.args}</code>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
