import { useLang } from '../i18n/LangContext'
import { useBlockNumber } from '../hooks/useBlockNumber'
import CopyButton from './CopyButton'

export default function WalletPanel({ wallet }) {
  const { t } = useLang()
  const block = useBlockNumber()
  const {
    address, chainId, balance, isConnecting, error,
    isOnArc, connect, disconnect, switchToArc,
  } = wallet

  return (
    <section className="card">
      <h2>{t('wallet')}</h2>

      {error && (
        <div className="status-msg status-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {!address ? (
        <div className="wallet-connect-area">
          <p className="wallet-hint">{t('walletHint')}</p>
          <button className="btn btn-primary" onClick={connect} disabled={isConnecting}>
            {isConnecting ? <><span className="spinner" /> {t('connecting')}</> : t('connectMetaMask')}
          </button>
        </div>
      ) : (
        <div className="wallet-info">
          <div className="wallet-row">
            <span className="label">{t('address')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="address">{address}</span>
              <CopyButton text={address} />
            </div>
          </div>
          <div className="wallet-row">
            <span className="label">{t('network')}</span>
            <span>
              {isOnArc
                ? <span className="badge badge-success">Arc Testnet</span>
                : <span className="badge badge-error">{t('wrongNetwork', { chainId })}</span>
              }
            </span>
          </div>
          <div className="wallet-row">
            <span className="label">{t('usdcBalance')}</span>
            <span className="mono">{balance !== null ? `${Number(balance).toFixed(4)} USDC` : '...'}</span>
          </div>
          {block !== null && (
            <div className="wallet-row">
              <span className="label">{t('block')}</span>
              <span className="mono" style={{ color: 'var(--accent)', textShadow: '0 0 6px rgba(0,255,65,0.4)' }}>
                #{block.toLocaleString()}
              </span>
            </div>
          )}
          <div className="wallet-actions">
            <button className="btn btn-danger" onClick={disconnect}>{t('disconnect')}</button>
          </div>

          {!isOnArc && (
            <div className="network-warning">
              <span>{t('notOnArc')}</span>
              <button className="btn btn-secondary" onClick={switchToArc}>{t('switchToArc')}</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
