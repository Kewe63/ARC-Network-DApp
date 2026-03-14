import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { ARCSCAN_TX_URL } from '../constants/network'
import TxDetailModal from './TxDetailModal'
import CopyButton from './CopyButton'

export default function TransactionHistory({ history, onClear }) {
  const { lang, t } = useLang()
  const [detail, setDetail] = useState(null)

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ marginBottom: 0 }}>{t('txHistory')}</h2>
        <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={onClear}>
          {t('clearHistory')}
        </button>
      </div>
      <div className="tx-list">
        {history.map((tx, i) => (
          <div className="tx-item" key={i}>
            <div className="tx-header">
              <span className="badge badge-info">{tx.type}</span>
              <span className="tx-time">{new Date(tx.timestamp).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
            </div>
            <div className="tx-row">
              <span className="label">{t('tx')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <a href={tx.arcScanTx} target="_blank" rel="noreferrer" className="address">
                  {tx.hash.slice(0, 18)}...{tx.hash.slice(-6)}
                </a>
                <CopyButton text={tx.hash} />
              </div>
            </div>
            {tx.address && (
              <div className="tx-row">
                <span className="label">{t('contract')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <a href={tx.arcScanAddr} target="_blank" rel="noreferrer" className="address">
                    {tx.address}
                  </a>
                  <CopyButton text={tx.address} />
                </div>
              </div>
            )}
            {tx.value && (
              <div className="tx-row">
                <span className="label">{t('value')}</span>
                <span>"{tx.value}"</span>
              </div>
            )}
            {tx.receipt && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: '0.4rem', fontSize: '0.7rem', padding: '0.2rem 0.6rem', alignSelf: 'flex-start' }}
                onClick={() => setDetail(tx.receipt)}
              >
                {t('detail')} ↗
              </button>
            )}
          </div>
        ))}
      </div>

      <TxDetailModal detail={detail} onClose={() => setDetail(null)} />
    </section>
  )
}
