import { useLang } from '../i18n/LangContext'
import { ARCSCAN_TX_URL } from '../constants/network'

export default function TxDetailModal({ detail, onClose }) {
  const { t } = useLang()
  if (!detail) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{t('txDetail')}</span>
          <button className="modal-close" onClick={onClose}>{t('close')}</button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <span className="label">{t('status')}</span>
            <span className={`badge ${detail.status === 1 ? 'badge-success' : 'badge-error'}`}>
              {detail.status === 1 ? 'SUCCESS' : 'FAILED'}
            </span>
          </div>
          <div className="modal-row">
            <span className="label">{t('blockNumber')}</span>
            <span className="mono">#{detail.blockNumber}</span>
          </div>
          <div className="modal-row">
            <span className="label">{t('gasUsed')}</span>
            <span className="mono">{detail.gasUsed?.toString()}</span>
          </div>
          <div className="modal-row">
            <span className="label">Tx Hash</span>
            <span className="address">{detail.hash?.slice(0, 20)}...{detail.hash?.slice(-8)}</span>
          </div>
          <a
            href={ARCSCAN_TX_URL(detail.hash)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ marginTop: '1rem', display: 'inline-flex' }}
          >
            {t('viewOnExplorer')} ↗
          </a>
        </div>
      </div>
    </div>
  )
}
