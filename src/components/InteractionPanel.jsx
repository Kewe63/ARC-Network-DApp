import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI, HELLO_ARCHITECT_ABI } from '../constants/network'
import EventListener from './EventListener'
import CopyButton from './CopyButton'

export default function InteractionPanel({ contract }) {
  const { t } = useLang()
  const { contractType, greeting, isReading, isWriting,
    deployedAddress, readGreeting, writeGreeting, callWrite, callRead,
    getAbiForType, setStatus } = contract

  // Hello
  const [newGreeting, setNewGreeting]     = useState('')

  // ERC-20
  const [transferTo, setTransferTo]       = useState('')
  const [transferAmt, setTransferAmt]     = useState('')
  const [balanceAddr, setBalanceAddr]     = useState('')
  const [balanceResult, setBalanceResult] = useState(null)
  const [approveSpender, setApproveSpender] = useState('')
  const [approveAmt, setApproveAmt]       = useState('')
  const [allowanceOwner, setAllowanceOwner] = useState('')
  const [allowanceSpender, setAllowanceSpender] = useState('')
  const [allowanceResult, setAllowanceResult] = useState(null)

  // ERC-721
  const [mintTo, setMintTo]           = useState('')
  const [mintUri, setMintUri]         = useState('')
  const [mintedId, setMintedId]       = useState(null)
  const [ownerOfId, setOwnerOfId]     = useState('')
  const [ownerResult, setOwnerResult] = useState(null)
  const [nftFrom, setNftFrom]         = useState('')
  const [nftTo, setNftTo]             = useState('')
  const [nftTokenId, setNftTokenId]   = useState('')

  // ERC-1155
  const [createAmt, setCreateAmt]         = useState('')
  const [createUri, setCreateUri]         = useState('')
  const [createdId, setCreatedId]         = useState(null)
  const [balId, setBalId]                 = useState('')
  const [balAddr1155, setBalAddr1155]     = useState('')
  const [bal1155Result, setBal1155Result] = useState(null)

  // Custom ABI
  const [showCustomAbi, setShowCustomAbi] = useState(false)
  const [customAbiText, setCustomAbiText] = useState('')

  const currentAbi = getAbiForType(contractType)

  const exportAbi = () => {
    const blob = new Blob([JSON.stringify(currentAbi, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${contractType}_abi.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!contractType) return null

  return (
    <section className="card">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ marginBottom: 0 }}>{t('contractInteraction')}</h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }} onClick={exportAbi}>
            ↓ {t('abiExport')}
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }} onClick={() => setShowCustomAbi(v => !v)}>
            {t('loadCustomAbi')}
          </button>
        </div>
      </div>

      {/* Deployed address */}
      {deployedAddress && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="label">{t('contract')}:</span>
          <span className="address" style={{ fontSize: '0.75rem' }}>{deployedAddress}</span>
          <CopyButton text={deployedAddress} />
        </div>
      )}

      {/* Custom ABI loader */}
      {showCustomAbi && (
        <div className="interaction-block">
          <h3 className="fn-name">{t('loadCustomAbi')}</h3>
          <textarea
            className="input"
            rows={4}
            placeholder={t('customAbiPlaceholder')}
            value={customAbiText}
            onChange={e => setCustomAbiText(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}
          />
          <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }}
            onClick={() => {
              try {
                JSON.parse(customAbiText)
                setStatus({ type: 'success', message: t('customAbiApplied') })
                setShowCustomAbi(false)
              } catch {
                setStatus({ type: 'error', message: t('invalidJson') })
              }
            }}>
            {t('applyAbi')}
          </button>
        </div>
      )}

      {/* ── HELLO ARCHITECT ── */}
      {contractType === 'hello' && (
        <>
          <div className="interaction-block">
            <h3 className="fn-name">getGreeting() <span className="badge badge-info">view</span></h3>
            <button className="btn btn-secondary" onClick={readGreeting} disabled={isReading}>
              {isReading ? <><span className="spinner" /> {t('reading')}</> : t('readGreeting')}
            </button>
            {greeting !== null && (
              <div className="greeting-result">
                <span className="label">{t('currentGreeting')}</span>
                <span className="greeting-value">"{greeting}"</span>
              </div>
            )}
          </div>
          <div className="interaction-block">
            <h3 className="fn-name">setGreeting(string) <span className="badge badge-warning">gas</span></h3>
            <div className="input-row">
              <input className="input" placeholder={t('newGreeting')} value={newGreeting} onChange={e => setNewGreeting(e.target.value)} />
              <button className="btn btn-primary" disabled={isWriting || !newGreeting} onClick={() => writeGreeting(newGreeting)}>
                {isWriting ? <><span className="spinner" /> {t('sending')}</> : t('update')}
              </button>
            </div>
          </div>
          <EventListener deployedAddress={deployedAddress} abi={HELLO_ARCHITECT_ABI} signer={contract.signer ?? null} />
        </>
      )}

      {/* ── ERC-20 ── */}
      {contractType === 'erc20' && (
        <>
          <div className="interaction-block">
            <h3 className="fn-name">balanceOf(address) <span className="badge badge-info">view</span></h3>
            <div className="input-row">
              <input className="input" placeholder="0x..." value={balanceAddr} onChange={e => setBalanceAddr(e.target.value)} />
              <button className="btn btn-secondary" disabled={isReading || !balanceAddr}
                onClick={async () => {
                  const r = await callRead(ERC20_ABI, 'balanceOf', [balanceAddr])
                  if (r !== null) setBalanceResult((Number(r) / 1e18).toFixed(4))
                }}>
                {isReading ? <span className="spinner" /> : t('query')}
              </button>
            </div>
            {balanceResult !== null && (
              <div className="greeting-result">
                <span className="label">{t('balance')}</span>
                <span className="greeting-value">{balanceResult} token</span>
              </div>
            )}
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">transfer(address, uint256) <span className="badge badge-warning">gas</span></h3>
            <div className="form-field">
              <label className="label">{t('recipient')}</label>
              <input className="input" placeholder="0x..." value={transferTo} onChange={e => setTransferTo(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('amount')}</label>
              <input className="input" placeholder="100" type="number" value={transferAmt} onChange={e => setTransferAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '0.75rem' }}
              disabled={isWriting || !transferTo || !transferAmt}
              onClick={() => callWrite(ERC20_ABI, 'transfer', [transferTo, BigInt(Math.floor(Number(transferAmt) * 1e18))], 'Transfer')}>
              {isWriting ? <><span className="spinner" /> {t('sending')}</> : t('transfer')}
            </button>
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">approve(address, uint256) <span className="badge badge-warning">gas</span></h3>
            <div className="form-field">
              <label className="label">{t('spender')}</label>
              <input className="input" placeholder="0x..." value={approveSpender} onChange={e => setApproveSpender(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('amount')}</label>
              <input className="input" placeholder="100" type="number" value={approveAmt} onChange={e => setApproveAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '0.75rem' }}
              disabled={isWriting || !approveSpender || !approveAmt}
              onClick={() => callWrite(ERC20_ABI, 'approve', [approveSpender, BigInt(Math.floor(Number(approveAmt) * 1e18))], 'Approve')}>
              {isWriting ? <><span className="spinner" /> {t('sending')}</> : t('approve')}
            </button>
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">allowance(owner, spender) <span className="badge badge-info">view</span></h3>
            <div className="form-field">
              <label className="label">{t('address')}</label>
              <input className="input" placeholder="0x... (owner)" value={allowanceOwner} onChange={e => setAllowanceOwner(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('spender')}</label>
              <input className="input" placeholder="0x... (spender)" value={allowanceSpender} onChange={e => setAllowanceSpender(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }}
              disabled={isReading || !allowanceOwner || !allowanceSpender}
              onClick={async () => {
                const r = await callRead(ERC20_ABI, 'allowance', [allowanceOwner, allowanceSpender])
                if (r !== null) setAllowanceResult((Number(r) / 1e18).toFixed(4))
              }}>
              {isReading ? <span className="spinner" /> : t('allowance')}
            </button>
            {allowanceResult !== null && (
              <div className="greeting-result">
                <span className="label">{t('allowanceResult')}</span>
                <span className="greeting-value">{allowanceResult} token</span>
              </div>
            )}
          </div>

          <EventListener deployedAddress={deployedAddress} abi={ERC20_ABI} signer={contract.signer ?? null} />
        </>
      )}

      {/* ── ERC-721 ── */}
      {contractType === 'erc721' && (
        <>
          <div className="interaction-block">
            <h3 className="fn-name">mint(address, string) <span className="badge badge-warning">gas</span></h3>
            <div className="form-field">
              <label className="label">{t('recipientAddress')}</label>
              <input className="input" placeholder="0x..." value={mintTo} onChange={e => setMintTo(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('tokenUri')}</label>
              <input className="input" placeholder={t('uriPlaceholder')} value={mintUri} onChange={e => setMintUri(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '0.75rem' }}
              disabled={isWriting || !mintTo}
              onClick={async () => {
                await callWrite(ERC721_ABI, 'mint', [mintTo, mintUri], 'Mint NFT')
                const r = await callRead(ERC721_ABI, 'nextTokenId', [])
                if (r !== null) setMintedId(Number(r) - 1)
              }}>
              {isWriting ? <><span className="spinner" /> {t('minting')}</> : t('mint')}
            </button>
            {mintedId !== null && (
              <div className="greeting-result">
                <span className="label">{t('lastMintedId')}</span>
                <span className="greeting-value">#{mintedId}</span>
              </div>
            )}
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">ownerOf(uint256) <span className="badge badge-info">view</span></h3>
            <div className="input-row">
              <input className="input" placeholder={t('tokenId')} type="number" value={ownerOfId} onChange={e => setOwnerOfId(e.target.value)} />
              <button className="btn btn-secondary" disabled={isReading || ownerOfId === ''}
                onClick={async () => {
                  const r = await callRead(ERC721_ABI, 'ownerOf', [ownerOfId])
                  if (r) setOwnerResult(r)
                }}>
                {isReading ? <span className="spinner" /> : t('query')}
              </button>
            </div>
            {ownerResult && (
              <div className="greeting-result">
                <span className="label">{t('owner')}</span>
                <span className="address">{ownerResult}</span>
              </div>
            )}
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">transferFrom(from, to, tokenId) <span className="badge badge-warning">gas</span></h3>
            <div className="form-field">
              <label className="label">{t('from')}</label>
              <input className="input" placeholder="0x..." value={nftFrom} onChange={e => setNftFrom(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('to')}</label>
              <input className="input" placeholder="0x..." value={nftTo} onChange={e => setNftTo(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('tokenId')}</label>
              <input className="input" placeholder="0" type="number" value={nftTokenId} onChange={e => setNftTokenId(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '0.75rem' }}
              disabled={isWriting || !nftFrom || !nftTo || nftTokenId === ''}
              onClick={() => callWrite(ERC721_ABI, 'transferFrom', [nftFrom, nftTo, nftTokenId], 'NFT Transfer')}>
              {isWriting ? <><span className="spinner" /> {t('sending')}</> : t('transferNft')}
            </button>
          </div>

          <EventListener deployedAddress={deployedAddress} abi={ERC721_ABI} signer={contract.signer ?? null} />
        </>
      )}

      {/* ── ERC-1155 ── */}
      {contractType === 'erc1155' && (
        <>
          <div className="interaction-block">
            <h3 className="fn-name">create(uint256, string) <span className="badge badge-warning">gas</span></h3>
            <div className="form-field">
              <label className="label">{t('quantity')}</label>
              <input className="input" placeholder="1000" type="number" value={createAmt} onChange={e => setCreateAmt(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('uri')}</label>
              <input className="input" placeholder="ipfs://..." value={createUri} onChange={e => setCreateUri(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '0.75rem' }}
              disabled={isWriting || !createAmt}
              onClick={async () => {
                await callWrite(ERC1155_ABI, 'create', [BigInt(createAmt), createUri], 'Create Token')
                const r = await callRead(ERC1155_ABI, 'nextId', [])
                if (r !== null) setCreatedId(Number(r) - 1)
              }}>
              {isWriting ? <><span className="spinner" /> {t('creating')}</> : t('createToken')}
            </button>
            {createdId !== null && (
              <div className="greeting-result">
                <span className="label">{t('createdTokenId')}</span>
                <span className="greeting-value">#{createdId}</span>
              </div>
            )}
          </div>

          <div className="interaction-block">
            <h3 className="fn-name">balanceOf(id, address) <span className="badge badge-info">view</span></h3>
            <div className="form-field">
              <label className="label">{t('tokenId')}</label>
              <input className="input" placeholder="0" type="number" value={balId} onChange={e => setBalId(e.target.value)} />
            </div>
            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="label">{t('address')}</label>
              <input className="input" placeholder="0x..." value={balAddr1155} onChange={e => setBalAddr1155(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }}
              disabled={isReading || balId === '' || !balAddr1155}
              onClick={async () => {
                const r = await callRead(ERC1155_ABI, 'balanceOf', [BigInt(balId), balAddr1155])
                if (r !== null) setBal1155Result(r.toString())
              }}>
              {isReading ? <><span className="spinner" /> {t('querying')}</> : t('queryBalance')}
            </button>
            {bal1155Result !== null && (
              <div className="greeting-result">
                <span className="label">{t('balance')}</span>
                <span className="greeting-value">{bal1155Result}</span>
              </div>
            )}
          </div>

          <EventListener deployedAddress={deployedAddress} abi={ERC1155_ABI} signer={contract.signer ?? null} />
        </>
      )}
    </section>
  )
}
