import { useState } from 'react'
import { Contract, keccak256, toUtf8Bytes } from 'ethers'
import { useLang } from '../i18n/LangContext'
import {
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  VALIDATION_REGISTRY,
  IDENTITY_ABI,
  REPUTATION_ABI,
  VALIDATION_ABI,
  ARCSCAN_TX_URL,
} from '../constants/network'

const STEPS = ['register', 'reputation', 'validation']

export default function AgentPanel({ signer, provider, ownerAddress, setStatus, addToHistory }) {
  const { t } = useLang()
  const [step, setStep] = useState('register')
  const [busy, setBusy]   = useState(false)

  // Register state
  const [metadataURI, setMetadataURI] = useState('ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei')
  const [agentId, setAgentId]         = useState(null)
  const [agentOwner, setAgentOwner]   = useState(null)
  const [agentTokenURI, setAgentTokenURI] = useState(null)

  // Reputation state
  const [repAgentId, setRepAgentId]   = useState('')
  const [repScore, setRepScore]       = useState('95')
  const [repTag, setRepTag]           = useState('successful_trade')

  // Validation state
  const [valAgentId, setValAgentId]         = useState('')
  const [valValidator, setValValidator]     = useState('')
  const [valRequestHash, setValRequestHash] = useState(null)
  const [valStatus, setValStatus]           = useState(null)

  const handleRegister = async () => {
    if (!signer) return
    const uri = metadataURI.trim() ||
      'ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei'
    setBusy(true)
    setStatus({ type: 'info', message: t('agentRegistering') })
    try {
      const contract = new Contract(IDENTITY_REGISTRY, IDENTITY_ABI, signer)
      const tx = await contract.register(uri)
      setStatus({ type: 'info', message: t('txSentWaiting') })
      const receipt = await tx.wait()

      // Transfer eventinden token ID al
      let mintedId = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'Transfer' && parsed.args.to.toLowerCase() === ownerAddress.toLowerCase()) {
            mintedId = parsed.args.tokenId.toString()
          }
        } catch {}
      }

      if (mintedId) {
        setAgentId(mintedId)
        const owner    = await contract.ownerOf(BigInt(mintedId))
        const tokenURI = await contract.tokenURI(BigInt(mintedId))
        setAgentOwner(owner)
        setAgentTokenURI(tokenURI)
        setRepAgentId(mintedId)
        setValAgentId(mintedId)
      }

      setStatus({ type: 'success', message: t('agentRegistered', { id: mintedId ?? '?' }) })
      addToHistory({
        type: 'Agent Register',
        hash: receipt.hash,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
      })
    } catch (err) {
      setStatus({ type: 'error', message: t('deployFail', { msg: err.message }) })
    } finally {
      setBusy(false)
    }
  }

  const handleReputation = async () => {
    if (!signer || !repAgentId) return
    setBusy(true)
    setStatus({ type: 'info', message: t('agentReputationSending') })
    try {
      const feedbackHash = keccak256(toUtf8Bytes(repTag))
      const contract = new Contract(REPUTATION_REGISTRY, REPUTATION_ABI, signer)
      const tx = await contract.giveFeedback(
        BigInt(repAgentId), repScore, 0, repTag, '', '', '', feedbackHash
      )
      setStatus({ type: 'info', message: t('txSentWaiting') })
      const receipt = await tx.wait()
      setStatus({ type: 'success', message: t('agentReputationDone') })
      addToHistory({
        type: 'Agent Reputation',
        hash: receipt.hash,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
      })
    } catch (err) {
      setStatus({ type: 'error', message: t('txFail', { msg: err.message }) })
    } finally {
      setBusy(false)
    }
  }

  const handleValidationRequest = async () => {
    if (!signer || !valAgentId || !valValidator) return
    setBusy(true)
    setStatus({ type: 'info', message: t('agentValReqSending') })
    try {
      const reqHash = keccak256(toUtf8Bytes(`kyc_verification_request_agent_${valAgentId}_${Date.now()}`))
      setValRequestHash(reqHash)
      const contract = new Contract(VALIDATION_REGISTRY, VALIDATION_ABI, signer)
      const tx = await contract.validationRequest(
        valValidator, BigInt(valAgentId),
        'ipfs://bafkreiexamplevalidationrequest', reqHash
      )
      setStatus({ type: 'info', message: t('txSentWaiting') })
      const receipt = await tx.wait()
      setStatus({ type: 'success', message: t('agentValReqDone') })
      addToHistory({
        type: 'Agent Val.Request',
        hash: receipt.hash,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
      })
    } catch (err) {
      setStatus({ type: 'error', message: t('txFail', { msg: err.message }) })
    } finally {
      setBusy(false)
    }
  }

  const handleValidationResponse = async () => {
    if (!signer || !valRequestHash) return
    setBusy(true)
    setStatus({ type: 'info', message: t('agentValResSending') })
    try {
      const contract = new Contract(VALIDATION_REGISTRY, VALIDATION_ABI, signer)
      const tx = await contract.validationResponse(
        valRequestHash, 100, '', '0x' + '0'.repeat(64), 'kyc_verified'
      )
      setStatus({ type: 'info', message: t('txSentWaiting') })
      const receipt = await tx.wait()
      setStatus({ type: 'success', message: t('agentValResDone') })
      addToHistory({
        type: 'Agent Val.Response',
        hash: receipt.hash,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
      })
    } catch (err) {
      setStatus({ type: 'error', message: t('txFail', { msg: err.message }) })
    } finally {
      setBusy(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!signer || !valRequestHash) return
    setBusy(true)
    try {
      const contract = new Contract(VALIDATION_REGISTRY, VALIDATION_ABI, signer)
      const result = await contract.getValidationStatus(valRequestHash)
      setValStatus({
        validator: result[0],
        agentId:   result[1].toString(),
        response:  result[2].toString(),
        tag:       result[4],
      })
      setStatus({ type: 'success', message: t('agentValStatusOk') })
    } catch (err) {
      setStatus({ type: 'error', message: t('readFail', { msg: err.message }) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2>{t('agentKit')}</h2>

      {/* Step tabs */}
      <div className="deploy-tabs">
        {STEPS.map(s => (
          <button
            key={s}
            className={`tab-btn ${step === s ? 'tab-active' : ''}`}
            onClick={() => setStep(s)}
          >
            {t(`agentStep_${s}`)}
          </button>
        ))}
      </div>

      <div className="deploy-body">

        {/* ── STEP 1: Register ── */}
        {step === 'register' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('agentRegisterDesc')}</p>

            <div className="form-field">
              <label className="label">{t('agentMetadataURI')}</label>
              <input
                className="input"
                placeholder="ipfs://baf... (boş bırakırsan örnek URI kullanılır)"
                value={metadataURI}
                onChange={e => setMetadataURI(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={handleRegister}
            >
              {busy ? <><span className="spinner" /> {t('deployingDots')}</> : t('agentRegisterBtn')}
            </button>

            {agentId && (
              <div className="agent-result">
                <div className="form-field">
                  <span className="label">{t('agentId')}</span>
                  <span className="address">{agentId}</span>
                </div>
                <div className="form-field">
                  <span className="label">{t('owner')}</span>
                  <span className="address">{agentOwner}</span>
                </div>
                <div className="form-field">
                  <span className="label">{t('agentTokenURI')}</span>
                  <span className="address" style={{ wordBreak: 'break-all' }}>{agentTokenURI}</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-success">{t('agentRegisteredBadge')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Reputation ── */}
        {step === 'reputation' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('agentReputationDesc')}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--status-warning)', marginBottom: '1rem' }}>
              // {t('wrongNetwork').includes('?') ? '' : 'Tip: '} 
              {t('en') === 'tr' ? 'Not: Kendi agentinize puan veremezsiniz (Self-feedback not allowed).' : 'Note: You cannot rate your own agent (Self-feedback not allowed).'}
            </p>

            <div className="form-field">
              <label className="label">{t('agentId')}</label>
              <input
                className="input"
                placeholder="42"
                value={repAgentId}
                onChange={e => setRepAgentId(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="label">{t('agentScore')}</label>
              <input
                className="input"
                type="number"
                min="-128"
                max="127"
                placeholder="95"
                value={repScore}
                onChange={e => setRepScore(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="label">{t('agentTag')}</label>
              <input
                className="input"
                placeholder="successful_trade"
                value={repTag}
                onChange={e => setRepTag(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={busy || !repAgentId}
              onClick={handleReputation}
            >
              {busy ? <><span className="spinner" /> {t('sending')}</> : t('agentReputationBtn')}
            </button>
          </div>
        )}

        {/* ── STEP 3: Validation ── */}
        {step === 'validation' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('agentValidationDesc')}</p>

            <div className="form-field">
              <label className="label">{t('agentId')}</label>
              <input
                className="input"
                placeholder="42"
                value={valAgentId}
                onChange={e => setValAgentId(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="label">{t('agentValidator')}</label>
              <input
                className="input"
                placeholder="0x... validator cüzdan adresi"
                value={valValidator}
                onChange={e => setValValidator(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                disabled={busy || !valAgentId || !valValidator}
                onClick={handleValidationRequest}
              >
                {busy ? <><span className="spinner" /> {t('sending')}</> : t('agentValReqBtn')}
              </button>

              <button
                className="btn btn-secondary"
                disabled={busy || !valRequestHash}
                onClick={handleValidationResponse}
              >
                {busy ? <><span className="spinner" /> {t('sending')}</> : t('agentValResBtn')}
              </button>

              <button
                className="btn btn-secondary"
                disabled={busy || !valRequestHash}
                onClick={handleCheckStatus}
              >
                {t('agentValCheckBtn')}
              </button>
            </div>

            {valRequestHash && (
              <div className="form-field" style={{ marginTop: '0.5rem' }}>
                <span className="label">{t('agentRequestHash')}</span>
                <code style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>{valRequestHash}</code>
              </div>
            )}

            {valStatus && (
              <div className="agent-result" style={{ marginTop: '0.75rem' }}>
                <div className="form-field">
                  <span className="label">{t('agentValidator')}</span>
                  <span className="address">{valStatus.validator}</span>
                </div>
                <div className="form-field">
                  <span className="label">{t('agentResponse')}</span>
                  <span style={{ color: valStatus.response === '100' ? 'var(--success)' : 'var(--error)' }}>
                    {valStatus.response} {valStatus.response === '100' ? '✓ passed' : '✗ failed'}
                  </span>
                </div>
                <div className="form-field">
                  <span className="label">Tag</span>
                  <span className="address">{valStatus.tag}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
