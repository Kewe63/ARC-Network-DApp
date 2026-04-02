import { useState, useEffect } from 'react'
import { formatUnits } from 'ethers'
import { useERC8183 } from '../hooks/useERC8183'
import CopyButton from './CopyButton'

export default function JobsPanel({ signer, address, setStatus, addToHistory }) {
  const {
    jobs, loadingJobs, fetchMyJobs, createJob, setBudget, fundJob, submitJob, completeJob
  } = useERC8183(signer, address)
  
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'create'
  
  // Create Job States
  const [providerInput, setProviderInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [hoursInput, setHoursInput] = useState('24')

  // Action States
  const [budgetAmt, setBudgetAmt] = useState({})
  const [deliverable, setDeliverable] = useState({})
  const [reason, setReason] = useState({})

  useEffect(() => {
    if (signer && address) {
      fetchMyJobs()
    }
  }, [signer, address, fetchMyJobs])

  const STATUS_NAMES = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"]

  const handleCreate = async () => {
    try {
      setStatus({ type: 'info', message: 'Creating job...' })
      const receipt = await createJob(providerInput, descInput, Number(hoursInput))
      addToHistory({ type: 'Create Job', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Job created successfully!' })
      setProviderInput('')
      setDescInput('')
      setActiveTab('list')
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSetBudget = async (id) => {
    try {
      setStatus({ type: 'info', message: `Setting budget for job ${id}...` })
      const amt = (Number(budgetAmt[id] || 0) * 1e6).toString()
      const receipt = await setBudget(id, amt)
      addToHistory({ type: 'Set Budget', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Budget set!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleFund = async (id, budgetBigInt) => {
    try {
      setStatus({ type: 'info', message: `Funding job ${id}...` })
      const receipt = await fundJob(id, budgetBigInt)
      addToHistory({ type: 'Fund Job', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Job funded!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSubmit = async (id) => {
    try {
      setStatus({ type: 'info', message: `Submitting deliverable...` })
      const receipt = await submitJob(id, deliverable[id] || 'default-deliverable')
      addToHistory({ type: 'Submit Deliverable', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Deliverable submitted!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleComplete = async (id) => {
    try {
      setStatus({ type: 'info', message: `Completing job...` })
      const receipt = await completeJob(id, reason[id] || 'work-approved')
      addToHistory({ type: 'Complete Job', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Job completed!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <section className="card">
      <h2>ERC-8183 Jobs</h2>

      <div className="deploy-tabs">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          My Created Jobs
        </button>
        <button
          className={`tab-btn ${activeTab === 'create' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Job
        </button>
      </div>

      <div className="deploy-body">
        {activeTab === 'create' && (
          <div className="deploy-form">
            <span className="deploy-desc">Create a new Agentic Commerce job</span>

            <div className="form-field">
              <span className="label">Provider Address</span>
              <input
                className="input"
                placeholder="0x..."
                value={providerInput}
                onChange={e => setProviderInput(e.target.value)}
              />
            </div>

            <div className="form-field">
              <span className="label">Description</span>
              <input
                className="input"
                placeholder="Brief job description"
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
              />
            </div>

            <div className="form-field">
              <span className="label">Expiration (Hours)</span>
              <input
                className="input"
                type="number"
                value={hoursInput}
                onChange={e => setHoursInput(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!providerInput || !descInput}
            >
              CREATE_JOB()
            </button>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="deploy-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="deploy-desc">Only jobs created by your current wallet</span>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={fetchMyJobs}>
                REFRESH
              </button>
            </div>

            {loadingJobs ? (
              <span className="mono status-warning">Loading jobs...</span>
            ) : jobs.length === 0 ? (
              <span className="mono status-info" style={{ color: 'var(--text-muted)' }}>No jobs found for this address.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map(job => (
                  <div key={job.id} className="interaction-block" style={{ padding: '1rem', border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                    <div className="fn-name" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>#{job.id} <span className={`badge ${job.status === 3 ? 'badge-success' : 'badge-info'}`}>{STATUS_NAMES[job.status]}</span></span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>Provider: <span className="address">{job.provider.substring(0,12)}...</span> <CopyButton text={job.provider}/></div>
                      <div>Budget: {formatUnits(job.budget || 0n, 6)} USDC</div>
                      <div style={{ color: 'var(--text-primary)' }}>Desc: {job.description}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      {/* Note: Provider can set budget, but you are the client in this list. 
                          So usually we only see FUND and COMPLETE buttons here for our own jobs. 
                          However, if this same wallet is ALSo the provider, they can set budget and submit. */}
                      {job.status === 0 && job.provider.toLowerCase() === (address || '').toLowerCase() && (
                        <div className="input-row">
                          <input className="input" placeholder="Budget (USDC)" type="number" onChange={e => setBudgetAmt({...budgetAmt, [job.id]: e.target.value})} />
                          <button className="btn btn-primary" onClick={() => handleSetBudget(job.id)}>SET_BUDGET</button>
                        </div>
                      )}

                      {job.status === 0 && job.client.toLowerCase() === (address || '').toLowerCase() && job.budget > 0n && (
                        <button className="btn btn-primary" onClick={() => handleFund(job.id, job.budget)}>FUND_ESCROW()</button>
                      )}
                      
                      {job.status === 1 && job.provider.toLowerCase() === (address || '').toLowerCase() && (
                        <div className="input-row">
                          <input className="input" placeholder="Deliverable Info" onChange={e => setDeliverable({...deliverable, [job.id]: e.target.value})} />
                          <button className="btn btn-primary" onClick={() => handleSubmit(job.id)}>SUBMIT</button>
                        </div>
                      )}

                      {job.status === 2 && job.evaluator.toLowerCase() === (address || '').toLowerCase() && (
                        <div className="input-row">
                          <input className="input" placeholder="Approval Reason" onChange={e => setReason({...reason, [job.id]: e.target.value})} />
                          <button className="btn btn-primary" onClick={() => handleComplete(job.id)}>COMPLETE</button>
                        </div>
                      )}
                      
                      {(job.status === 3) && <span className="mono status-success" style={{fontSize: '0.7rem', padding: '0.4em 0.8em'}}>JOB_COMPLETED</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
