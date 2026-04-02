import { useState, useEffect } from 'react'
import { formatUnits } from 'ethers'
import { useERC8183 } from '../hooks/useERC8183'
import CopyButton from './CopyButton'

export default function JobsPanel({ signer, address, setStatus, addToHistory }) {
  const {
    jobs, loadingJobs, fetchMyJobs, createJob, setBudget, fundJob, submitJob, completeJob
  } = useERC8183(signer, address)
  
  const [activeTab, setActiveTab] = useState('list') 
  
  // Action States
  const [jobIdInput, setJobIdInput] = useState('')
  const [providerInput, setProviderInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [hoursInput, setHoursInput] = useState('24')
  
  const [budgetAmt, setBudgetAmt] = useState('')
  const [deliverableStr, setDeliverableStr] = useState('')
  const [reasonStr, setReasonStr] = useState('')

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
      fetchMyJobs()
      setActiveTab('list')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSetBudget = async () => {
    try {
      setStatus({ type: 'info', message: `Setting budget for job ${jobIdInput}...` })
      const amt = (Number(budgetAmt || 0) * 1e6).toString()
      const receipt = await setBudget(jobIdInput, amt)
      addToHistory({ type: 'Set Budget', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Budget set!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleFund = async () => {
    try {
      setStatus({ type: 'info', message: `Funding job ${jobIdInput}...` })
      const amt = (Number(budgetAmt || 0) * 1e6).toString()
      const receipt = await fundJob(jobIdInput, amt)
      addToHistory({ type: 'Fund Job', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Job funded!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSubmit = async () => {
    try {
      setStatus({ type: 'info', message: `Submitting deliverable...` })
      const receipt = await submitJob(jobIdInput, deliverableStr || 'default-deliverable')
      addToHistory({ type: 'Submit Deliverable', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Deliverable submitted!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleComplete = async () => {
    try {
      setStatus({ type: 'info', message: `Completing job...` })
      const receipt = await completeJob(jobIdInput, reasonStr || 'work-approved')
      addToHistory({ type: 'Complete Job', hash: receipt.hash })
      setStatus({ type: 'success', message: 'Job completed!' })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  // A helper auto-fill job ID button for list view
  const fillJobIdAndGoTo = (id, tab) => {
    setJobIdInput(id.toString());
    setActiveTab(tab);
  }

  return (
    <section className="card">
      <h2>ERC-8183 Jobs</h2>

      <div className="deploy-tabs">
        <button className={`tab-btn ${activeTab === 'list' ? 'tab-active' : ''}`} onClick={() => setActiveTab('list')}>MY JOBS</button>
        <button className={`tab-btn ${activeTab === 'create' ? 'tab-active' : ''}`} onClick={() => setActiveTab('create')}>CREATE</button>
        <button className={`tab-btn ${activeTab === 'budget' ? 'tab-active' : ''}`} onClick={() => setActiveTab('budget')}>SET BUDGET</button>
        <button className={`tab-btn ${activeTab === 'fund' ? 'tab-active' : ''}`} onClick={() => setActiveTab('fund')}>FUND</button>
        <button className={`tab-btn ${activeTab === 'submit' ? 'tab-active' : ''}`} onClick={() => setActiveTab('submit')}>SUBMIT</button>
        <button className={`tab-btn ${activeTab === 'complete' ? 'tab-active' : ''}`} onClick={() => setActiveTab('complete')}>COMPLETE</button>
      </div>

      <div className="deploy-body">
        
        {/* --- LIST TAB --- */}
        {activeTab === 'list' && (
          <div className="deploy-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="deploy-desc">// Only jobs created by your current wallet</span>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={fetchMyJobs}>REFRESH</button>
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
                      <div>Provider: <span className="address">{job.provider.substring(0,10)}...</span> <CopyButton text={job.provider}/></div>
                      <div>Budget: {formatUnits(job.budget || 0n, 6)} USDC</div>
                      <div style={{ color: 'var(--text-primary)' }}>Desc: {job.description}</div>
                    </div>
                    {/* Fast Navigation Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '100%' }}>// Quick Actions</span>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'budget')}>Set Budget</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => { fillJobIdAndGoTo(job.id, 'fund'); setBudgetAmt(formatUnits(job.budget, 6)); }}>Fund</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'submit')}>Submit</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'complete')}>Complete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CREATE JOB TAB --- */}
        {activeTab === 'create' && (
          <div className="deploy-form">
            <span className="deploy-desc">Create a new Agentic Commerce job</span>
            <div className="form-field">
              <span className="label">Provider Address</span>
              <input className="input" placeholder="0x..." value={providerInput} onChange={e => setProviderInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Description</span>
              <input className="input" placeholder="Brief job description" value={descInput} onChange={e => setDescInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Expiration (Hours)</span>
              <input className="input" type="number" value={hoursInput} onChange={e => setHoursInput(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!providerInput || !descInput}>CREATE_JOB()</button>
          </div>
        )}

        {/* --- SET BUDGET TAB --- */}
        {activeTab === 'budget' && (
          <div className="deploy-form">
            <span className="deploy-desc">Set budget for an existing job (Must be the Provider)</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="Enter Job ID" value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Budget Amount (USDC)</span>
              <input className="input" type="number" placeholder="e.g. 5" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSetBudget} disabled={!jobIdInput || !budgetAmt}>SET_BUDGET()</button>
          </div>
        )}

        {/* --- FUND ESCROW TAB --- */}
        {activeTab === 'fund' && (
          <div className="deploy-form">
            <span className="deploy-desc">Approve and Fund a job (Must be the Client)</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="Enter Job ID" value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Total Amount to Approve (USDC)</span>
              <input className="input" type="number" placeholder="Must match the set budget..." value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleFund} disabled={!jobIdInput || !budgetAmt}>FUND_ESCROW()</button>
          </div>
        )}

        {/* --- SUBMIT DELIVERABLE TAB --- */}
        {activeTab === 'submit' && (
          <div className="deploy-form">
            <span className="deploy-desc">Submit deliverable hash for a funded job (Must be the Provider)</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="Enter Job ID" value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Deliverable Information</span>
              <input className="input" placeholder="e.g. github-link-or-hash" value={deliverableStr} onChange={e => setDeliverableStr(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!jobIdInput || !deliverableStr}>SUBMIT_DELIVERABLE()</button>
          </div>
        )}

        {/* --- COMPLETE JOB TAB --- */}
        {activeTab === 'complete' && (
          <div className="deploy-form">
            <span className="deploy-desc">Approve the deliverable and release funds (Must be Evaluator/Client)</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="Enter Job ID" value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">Approval Reason</span>
              <input className="input" placeholder="e.g. work-approved" value={reasonStr} onChange={e => setReasonStr(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleComplete} disabled={!jobIdInput || !reasonStr}>COMPLETE_JOB()</button>
          </div>
        )}

      </div>
    </section>
  )
}
