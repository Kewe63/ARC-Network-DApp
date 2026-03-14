import { useState, useCallback } from 'react'
import { Contract } from 'ethers'
import { useLang } from '../i18n/LangContext'
import {
  HELLO_ARCHITECT_ABI,
  ERC20_ABI,
  ERC721_ABI,
  ERC1155_ABI,
  ARCSCAN_TX_URL,
} from '../constants/network'

const STORAGE_KEY = 'arc_tx_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function saveHistory(h) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 50))) } catch {}
}

export function useContract(signer) {
  const { t } = useLang()
  const [deployedAddress, setDeployedAddress] = useState(null)
  const [contractType, setContractType]       = useState(null)
  const [greeting, setGreeting]               = useState(null)
  const [isReading, setIsReading]             = useState(false)
  const [isWriting, setIsWriting]             = useState(false)
  const [txHistory, setTxHistory]             = useState(loadHistory)
  const [status, setStatus]                   = useState(null)

  const addToHistory = useCallback((entry) => {
    setTxHistory(prev => {
      const next = [entry, ...prev]
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setTxHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const handleDeploy = useCallback((addr, type) => {
    setDeployedAddress(addr)
    setContractType(type)
    setGreeting(null)
  }, [])

  const getAbiForType = (type) => {
    if (type === 'erc20')   return ERC20_ABI
    if (type === 'erc721')  return ERC721_ABI
    if (type === 'erc1155') return ERC1155_ABI
    return HELLO_ARCHITECT_ABI
  }

  const readGreeting = useCallback(async () => {
    if (!signer || !deployedAddress) return
    setIsReading(true)
    setStatus({ type: 'info', message: t('readingGreeting') })
    try {
      const contract = new Contract(deployedAddress, HELLO_ARCHITECT_ABI, signer)
      const result   = await contract.getGreeting()
      setGreeting(result)
      setStatus({ type: 'success', message: t('greetingReadOk') })
    } catch (err) {
      setStatus({ type: 'error', message: t('readFail', { msg: err.message }) })
    } finally {
      setIsReading(false)
    }
  }, [signer, deployedAddress, t])

  const writeGreeting = useCallback(async (newGreeting) => {
    if (!signer || !deployedAddress) return
    setIsWriting(true)
    setStatus({ type: 'info', message: t('sendingSetGreeting') })
    try {
      const contract = new Contract(deployedAddress, HELLO_ARCHITECT_ABI, signer)
      const tx       = await contract.setGreeting(newGreeting)
      setStatus({ type: 'info', message: t('txSent', { hash: tx.hash }) })
      const receipt  = await tx.wait()
      setGreeting(newGreeting)
      setStatus({ type: 'success', message: t('greetingUpdated') })
      addToHistory({
        type: 'setGreeting',
        hash: receipt.hash,
        value: newGreeting,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
        receipt: { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed?.toString(), status: receipt.status },
      })
    } catch (err) {
      setStatus({ type: 'error', message: t('writeFail', { msg: err.message }) })
    } finally {
      setIsWriting(false)
    }
  }, [signer, deployedAddress, addToHistory, t])

  const callWrite = useCallback(async (abi, fnName, args, label) => {
    if (!signer || !deployedAddress) return null
    setIsWriting(true)
    setStatus({ type: 'info', message: t('sendingTx', { label }) })
    try {
      const contract = new Contract(deployedAddress, abi, signer)
      const tx       = await contract[fnName](...args)
      setStatus({ type: 'info', message: t('txSent', { hash: tx.hash }) })
      const receipt  = await tx.wait()
      setStatus({ type: 'success', message: t('txSuccess', { label }) })
      addToHistory({
        type: label,
        hash: receipt.hash,
        timestamp: new Date().toISOString(),
        arcScanTx: ARCSCAN_TX_URL(receipt.hash),
        receipt: { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed?.toString(), status: receipt.status },
      })
      return receipt
    } catch (err) {
      setStatus({ type: 'error', message: t('txFail', { msg: err.message }) })
      return null
    } finally {
      setIsWriting(false)
    }
  }, [signer, deployedAddress, addToHistory, t])

  const callRead = useCallback(async (abi, fnName, args) => {
    if (!signer || !deployedAddress) return null
    setIsReading(true)
    try {
      const contract = new Contract(deployedAddress, abi, signer)
      const result   = await contract[fnName](...args)
      setIsReading(false)
      return result
    } catch (err) {
      setStatus({ type: 'error', message: t('readFail', { msg: err.message }) })
      setIsReading(false)
      return null
    }
  }, [signer, deployedAddress, t])

  return {
    deployedAddress, contractType, greeting,
    isReading, isWriting, txHistory, status,
    setStatus, addToHistory, clearHistory, getAbiForType,
    handleDeploy, readGreeting, writeGreeting,
    callWrite, callRead,
  }
}
