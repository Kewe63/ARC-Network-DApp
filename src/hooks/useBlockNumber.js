import { useEffect, useState, useCallback } from 'react'
import { BrowserProvider } from 'ethers'
import { ARC_CHAIN_ID } from '../constants/network'

export function useBlockNumber() {
  const [block, setBlock] = useState(null)

  useEffect(() => {
    if (!window.ethereum) return
    const prov = new BrowserProvider(window.ethereum)
    let cancelled = false

    const fetch = async () => {
      try {
        const n = await prov.getBlockNumber()
        if (!cancelled) setBlock(n)
      } catch {}
    }

    fetch()
    const id = setInterval(fetch, 6000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return block
}
