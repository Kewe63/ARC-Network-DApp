import { useWallet }          from './hooks/useWallet'
import { useContract }        from './hooks/useContract'
import { useTerminalLog }     from './hooks/useTerminalLog'
import Header                 from './components/Header'
import WalletPanel            from './components/WalletPanel'
import DeployPanel            from './components/DeployPanel'
import InteractionPanel       from './components/InteractionPanel'
import AgentPanel             from './components/AgentPanel'
import JobsPanel              from './components/JobsPanel'
import TransactionHistory     from './components/TransactionHistory'
import StatusBar              from './components/StatusBar'
import MatrixRain             from './components/MatrixRain'
import TerminalLog            from './components/TerminalLog'
import './App.css'

export default function App() {
  const wallet   = useWallet()
  const contract = useContract(wallet.signer)
  const { logs, addLog, clearLogs } = useTerminalLog()

  // Status değişikliklerini terminal log'a yansıt
  const proxySetStatus = (s) => {
    contract.setStatus(s)
    if (s) addLog(s.type, s.message)
  }

  const proxyAddToHistory = (entry) => {
    contract.addToHistory(entry)
    addLog('success', `${entry.type} — ${entry.hash?.slice(0, 16)}...`)
  }

  return (
    <div className="app">
      <MatrixRain />
      <Header />

      <main className="main-grid">
        <WalletPanel wallet={wallet} />

        {wallet.address && wallet.isOnArc && (
          <>
            <DeployPanel
              signer={wallet.signer}
              onDeploy={contract.handleDeploy}
              onRefreshBalance={() => wallet.refreshBalance(wallet.provider, wallet.address)}
              setStatus={proxySetStatus}
              addToHistory={proxyAddToHistory}
            />
            {contract.deployedAddress && (
              <InteractionPanel contract={{ ...contract, setStatus: proxySetStatus }} />
            )}
            <AgentPanel
              signer={wallet.signer}
              provider={wallet.provider}
              ownerAddress={wallet.address}
              setStatus={proxySetStatus}
              addToHistory={proxyAddToHistory}
            />
            <JobsPanel
              signer={wallet.signer}
              address={wallet.address}
              setStatus={proxySetStatus}
              addToHistory={proxyAddToHistory}
            />
          </>
        )}

        {contract.txHistory.length > 0 && (
          <TransactionHistory
            history={contract.txHistory}
            onClear={contract.clearHistory}
          />
        )}

        <TerminalLog logs={logs} onClear={clearLogs} />
      </main>

      {contract.status && <StatusBar status={contract.status} />}
    </div>
  )
}
