import { useState, useCallback, useRef } from 'react'

export function useTerminalLog() {
  const [logs, setLogs] = useState([])
  const idRef = useRef(0)

  const addLog = useCallback((type, message) => {
    const id = ++idRef.current
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [...prev.slice(-199), { id, type, message, time }])
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { logs, addLog, clearLogs }
}
