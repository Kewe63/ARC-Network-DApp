import { useState, useCallback } from 'react'
import { useLang } from '../i18n/LangContext'
import { ARCSCAN_TX_URL } from '../constants/network'

export function useTxDetail() {
  const { t } = useLang()
  const [detail, setDetail] = useState(null)

  const showDetail = useCallback((receipt) => {
    setDetail(receipt)
  }, [])

  const close = useCallback(() => setDetail(null), [])

  return { detail, showDetail, close }
}
