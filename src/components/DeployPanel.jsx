import { useState } from 'react'
import { ContractFactory } from 'ethers'
import { useLang } from '../i18n/LangContext'
import {
  HELLO_ARCHITECT_ABI, HELLO_ARCHITECT_BYTECODE,
  ERC20_ABI, ERC20_BYTECODE,
  ERC721_ABI, ERC721_BYTECODE,
  ERC1155_ABI, ERC1155_BYTECODE,
  ARCSCAN_TX_URL, ARCSCAN_ADDRESS_URL,
} from '../constants/network'

const TABS = [
  { id: 'hello',   labelKey: 'HelloArchitect' },
  { id: 'erc20',   labelKey: 'ERC-20 Token' },
  { id: 'erc721',  labelKey: 'ERC-721 NFT' },
  { id: 'erc1155', labelKey: 'ERC-1155 Multi' },
]

export default function DeployPanel({ signer, onDeploy, onRefreshBalance, setStatus, addToHistory }) {
  const { t } = useLang()
  const [tab, setTab]               = useState('hello')
  const [isDeploying, setIsDeploying] = useState(false)

  const [tokenName, setTokenName]     = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenSupply, setTokenSupply] = useState('')

  const [nftName, setNftName]     = useState('')
  const [nftSymbol, setNftSymbol] = useState('')

  const [multiName, setMultiName] = useState('')

  const [loadAddr, setLoadAddr] = useState('')

  const deploy = async (abi, bytecode, args, label) => {
    if (!signer) return
    setIsDeploying(true)
    setStatus({ type: 'info', message: t('deploying', { label }) })
    try {
      const factory  = new ContractFactory(abi, bytecode, signer)
      const contract = await factory.deploy(...args)
      setStatus({ type: 'info', message: t('txSentWaiting') })
      const receipt  = await contract.deploymentTransaction().wait()
      const addr     = await contract.getAddress()
      onDeploy(addr, tab)
      setStatus({ type: 'success', message: t('deployedAt', { label, addr }) })
      addToHistory({
        type: `Deploy ${label}`,
        hash: receipt.hash,
        address: addr,
        timestamp: new Date().toISOString(),
        arcScanTx:   ARCSCAN_TX_URL(receipt.hash),
        arcScanAddr: ARCSCAN_ADDRESS_URL(addr),
      })
      onRefreshBalance()
    } catch (err) {
      setStatus({ type: 'error', message: t('deployFail', { msg: err.message }) })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <section className="card">
      <h2>{t('deploy')}</h2>

      <div className="deploy-tabs">
        {TABS.map(tab_ => (
          <button
            key={tab_.id}
            className={`tab-btn ${tab === tab_.id ? 'tab-active' : ''}`}
            onClick={() => setTab(tab_.id)}
          >
            {tab_.labelKey}
          </button>
        ))}
      </div>

      <div className="deploy-body">
        {tab === 'hello' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('helloDesc')}</p>
            <button
              className="btn btn-primary"
              disabled={isDeploying}
              onClick={() => deploy(HELLO_ARCHITECT_ABI, HELLO_ARCHITECT_BYTECODE, [], 'HelloArchitect')}
            >
              {isDeploying ? <><span className="spinner" /> {t('deployingDots')}</> : t('deployHello')}
            </button>
          </div>
        )}

        {tab === 'erc20' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('erc20Desc')}</p>
            <div className="form-field">
              <label className="label">{t('tokenName')}</label>
              <input className="input" placeholder="My Token" value={tokenName} onChange={e => setTokenName(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">{t('symbol')}</label>
              <input className="input" placeholder="MTK" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">{t('totalSupply')}</label>
              <input className="input" placeholder="1000000" type="number" value={tokenSupply} onChange={e => setTokenSupply(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              disabled={isDeploying || !tokenName || !tokenSymbol || !tokenSupply}
              onClick={() => deploy(ERC20_ABI, ERC20_BYTECODE, [tokenName, tokenSymbol, BigInt(tokenSupply)], 'ERC-20')}
            >
              {isDeploying ? <><span className="spinner" /> {t('deployingDots')}</> : t('deployErc20')}
            </button>
          </div>
        )}

        {tab === 'erc721' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('erc721Desc')}</p>
            <div className="form-field">
              <label className="label">{t('collectionName')}</label>
              <input className="input" placeholder="My NFT" value={nftName} onChange={e => setNftName(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">{t('symbol')}</label>
              <input className="input" placeholder="MNFT" value={nftSymbol} onChange={e => setNftSymbol(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              disabled={isDeploying || !nftName || !nftSymbol}
              onClick={() => deploy(ERC721_ABI, ERC721_BYTECODE, [nftName, nftSymbol], 'ERC-721 NFT')}
            >
              {isDeploying ? <><span className="spinner" /> {t('deployingDots')}</> : t('deployErc721')}
            </button>
          </div>
        )}

        {tab === 'erc1155' && (
          <div className="deploy-form">
            <p className="deploy-desc">{t('erc1155Desc')}</p>
            <div className="form-field">
              <label className="label">{t('collectionName')}</label>
              <input className="input" placeholder="My Multi Token" value={multiName} onChange={e => setMultiName(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              disabled={isDeploying || !multiName}
              onClick={() => deploy(ERC1155_ABI, ERC1155_BYTECODE, [multiName], 'ERC-1155')}
            >
              {isDeploying ? <><span className="spinner" /> {t('deployingDots')}</> : t('deployErc1155')}
            </button>
          </div>
        )}

        <div className="deploy-load">
          <p className="label" style={{ marginBottom: '0.5rem' }}>{t('loadExisting')}</p>
          <div className="input-row">
            <input
              className="input"
              placeholder="0x..."
              value={loadAddr}
              onChange={e => setLoadAddr(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={() => loadAddr && onDeploy(loadAddr, tab)}
            >
              {t('load')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
