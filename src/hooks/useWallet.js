import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, formatUnits } from 'ethers'
import { useLang } from '../i18n/LangContext'
import { ARC_TESTNET, ARC_CHAIN_ID } from '../constants/network'

export function useWallet() {
  const { t } = useLang()
  const [provider, setProvider]         = useState(null)
  const [signer, setSigner]             = useState(null)
  const [address, setAddress]           = useState(null)
  const [chainId, setChainId]           = useState(null)
  const [balance, setBalance]           = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError]               = useState(null)

  const isOnArc = chainId === ARC_CHAIN_ID

  const refreshBalance = useCallback(async (prov, addr) => {
    try {
      const raw = await prov.getBalance(addr)
      setBalance(formatUnits(raw, 6))
    } catch {
      setBalance(null)
    }
  }, [])

  const switchToArc = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_TESTNET.chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ARC_TESTNET],
        })
      } else {
        throw switchError
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError(t('noMetaMask'))
      return
    }
    setIsConnecting(true)
    setError(null)
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const prov = new BrowserProvider(window.ethereum)
      const net  = await prov.getNetwork()
      const sign = await prov.getSigner()
      const addr = await sign.getAddress()
      setProvider(prov)
      setSigner(sign)
      setAddress(addr)
      setChainId(Number(net.chainId))
      await refreshBalance(prov, addr)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsConnecting(false)
    }
  }, [refreshBalance, t])

  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setBalance(null)
    setError(null)
  }, [])

  useEffect(() => {
    if (!window.ethereum) return
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect()
      else connect()
    }
    const onChainChanged = () => window.location.reload()
    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [connect, disconnect])

  return {
    provider, signer, address, chainId, balance,
    isConnecting, error, isOnArc,
    connect, disconnect, switchToArc, refreshBalance,
  }
}
