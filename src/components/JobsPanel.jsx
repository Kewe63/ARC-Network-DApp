import { useState, useEffect } from 'react'
import { formatUnits } from 'ethers'
import { useERC8183 } from '../hooks/useERC8183'
import { useLang } from '../i18n/LangContext'
import CopyButton from './CopyButton'

export default function JobsPanel({ signer, address, setStatus, addToHistory }) {
  const { t } = useLang()
  const {
    jobs, loadingJobs, fetchMyJobs, createJob, setBudget, fundJob, submitJob, completeJob
  } = useERC8183(signer, address)
  
  const [activeTab, setActiveTab] = useState('list') 
  
  // Action States
  const [jobIdInput, setJobIdInput] = useState('')
  const [providerInput, setProviderInput] = useState('')
  const [evaluatorInput, setEvaluatorInput] = useState('')
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

  const getStatusName = (status) => {
    return t(`jobStatus_${status}`) || status.toString()
  }

  const handleCreate = async () => {
    try {
      setStatus({ type: 'info', message: t('sendingTx', { label: t('jobCreate') }) })
      const receipt = await createJob(providerInput, evaluatorInput || address, descInput, Number(hoursInput))
      addToHistory({ type: t('jobCreate'), hash: receipt.hash })
      setStatus({ type: 'success', message: t('jobCreated') })
      fetchMyJobs()
      setActiveTab('list')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSetBudget = async () => {
    try {
      setStatus({ type: 'info', message: t('sendingTx', { label: t('jobSetBudget') }) })
      const amt = (Number(budgetAmt || 0) * 1e6).toString()
      const receipt = await setBudget(jobIdInput, amt)
      addToHistory({ type: t('jobSetBudget'), hash: receipt.hash })
      setStatus({ type: 'success', message: t('jobBudgetSet') })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleFund = async () => {
    try {
      setStatus({ type: 'info', message: t('sendingTx', { label: t('jobFund') }) })
      const amt = (Number(budgetAmt || 0) * 1e6).toString()
      const receipt = await fundJob(jobIdInput, amt)
      addToHistory({ type: t('jobFund'), hash: receipt.hash })
      setStatus({ type: 'success', message: t('jobFunded') })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleSubmit = async () => {
    try {
      setStatus({ type: 'info', message: t('sendingTx', { label: t('jobSubmit') }) })
      const receipt = await submitJob(jobIdInput, deliverableStr || 'default-deliverable')
      addToHistory({ type: t('jobSubmit'), hash: receipt.hash })
      setStatus({ type: 'success', message: t('jobSubmitted') })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const handleComplete = async () => {
    try {
      setStatus({ type: 'info', message: t('sendingTx', { label: t('jobComplete') }) })
      const receipt = await completeJob(jobIdInput, reasonStr || 'work-approved')
      addToHistory({ type: t('jobComplete'), hash: receipt.hash })
      setStatus({ type: 'success', message: t('jobCompleted') })
      fetchMyJobs()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  const fillJobIdAndGoTo = (id, tab) => {
    setJobIdInput(id.toString());
    setActiveTab(tab);
  }

  return (
    <section className="card">
      <h2>{t('jobSystem')}</h2>

      <div className="deploy-tabs">
        <button className={`tab-btn ${activeTab === 'list' ? 'tab-active' : ''}`} onClick={() => setActiveTab('list')}>{t('jobList').toUpperCase()}</button>
        <button className={`tab-btn ${activeTab === 'create' ? 'tab-active' : ''}`} onClick={() => setActiveTab('create')}>{t('jobCreate').toUpperCase()}</button>
        <button className={`tab-btn ${activeTab === 'budget' ? 'tab-active' : ''}`} onClick={() => setActiveTab('budget')}>{t('jobSetBudget').toUpperCase()}</button>
        <button className={`tab-btn ${activeTab === 'fund' ? 'tab-active' : ''}`} onClick={() => setActiveTab('fund')}>{t('jobFund').toUpperCase()}</button>
        <button className={`tab-btn ${activeTab === 'submit' ? 'tab-active' : ''}`} onClick={() => setActiveTab('submit')}>{t('jobSubmit').toUpperCase()}</button>
        <button className={`tab-btn ${activeTab === 'complete' ? 'tab-active' : ''}`} onClick={() => setActiveTab('complete')}>{t('jobComplete').toUpperCase()}</button>
      </div>

      <div className="deploy-body">
        
        {/* --- LIST TAB --- */}
        {activeTab === 'list' && (
          <div className="deploy-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="deploy-desc">// {t('jobList')}</span>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={fetchMyJobs}>{t('update').toUpperCase()}</button>
            </div>

            {loadingJobs ? (
              <span className="mono status-warning">{t('jobLoading')}</span>
            ) : jobs.length === 0 ? (
              <span className="mono status-info" style={{ color: 'var(--text-muted)' }}>{t('jobNone')}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map(job => (
                  <div key={job.id} className="interaction-block" style={{ padding: '1rem', border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                    <div className="fn-name" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>#{job.id} <span className={`badge ${job.status === 3 ? 'badge-success' : 'badge-info'}`}>{getStatusName(job.status)}</span></span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>{t('jobProvider')}: <span className="address">{job.provider.substring(0,10)}...</span> <CopyButton text={job.provider}/></div>
                      <div>{t('jobEvaluator')}: <span className="address">{job.evaluator.substring(0,10)}...</span> <CopyButton text={job.evaluator}/></div>
                      <div>{t('jobBudget')}: {formatUnits(job.budget || 0n, 6)} USDC</div>
                      <div style={{ color: 'var(--text-primary)' }}>{t('jobDescription')}: {job.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '100%' }}>// {t('detail')}</span>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'budget')}>{t('jobSetBudget')}</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => { fillJobIdAndGoTo(job.id, 'fund'); setBudgetAmt(formatUnits(job.budget, 6)); }}>{t('jobFund')}</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'submit')}>{t('jobSubmit')}</button>
                       <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => fillJobIdAndGoTo(job.id, 'complete')}>{t('jobComplete')}</button>
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
            <span className="deploy-desc">{t('jobCreate')}</span>
            <div className="form-field">
              <span className="label">{t('jobProvider')}</span>
              <input className="input" placeholder="0x..." value={providerInput} onChange={e => setProviderInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobEvaluator')}</span>
              <input className="input" placeholder={t('address')} value={evaluatorInput} onChange={e => setEvaluatorInput(e.target.value)} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>// Leave blank to use your own address</span>
            </div>
            <div className="form-field">
              <span className="label">{t('jobDescription')}</span>
              <input className="input" placeholder="..." value={descInput} onChange={e => setDescInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobExpiration')}</span>
              <input className="input" type="number" value={hoursInput} onChange={e => setHoursInput(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!providerInput || !descInput}>CREATE_JOB()</button>
          </div>
        )}

        {/* --- SET BUDGET TAB --- */}
        {activeTab === 'budget' && (
          <div className="deploy-form">
            <span className="deploy-desc">{t('jobSetBudget')}</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="..." value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobBudget')}</span>
              <input className="input" type="number" placeholder="5" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSetBudget} disabled={!jobIdInput || !budgetAmt}>SET_BUDGET()</button>
          </div>
        )}

        {/* --- FUND ESCROW TAB --- */}
        {activeTab === 'fund' && (
          <div className="deploy-form">
            <span className="deploy-desc">{t('jobFund')}</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="..." value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobBudget')}</span>
              <input className="input" type="number" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleFund} disabled={!jobIdInput || !budgetAmt}>FUND_ESCROW()</button>
          </div>
        )}

        {/* --- SUBMIT DELIVERABLE TAB --- */}
        {activeTab === 'submit' && (
          <div className="deploy-form">
            <span className="deploy-desc">{t('jobSubmit')}</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="..." value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobDeliverable')}</span>
              <input className="input" placeholder="..." value={deliverableStr} onChange={e => setDeliverableStr(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!jobIdInput || !deliverableStr}>SUBMIT_DELIVERABLE()</button>
          </div>
        )}

        {/* --- COMPLETE JOB TAB --- */}
        {activeTab === 'complete' && (
          <div className="deploy-form">
            <span className="deploy-desc">{t('jobComplete')}</span>
            <div className="form-field">
              <span className="label">Job ID</span>
              <input className="input" type="number" placeholder="..." value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} />
            </div>
            <div className="form-field">
              <span className="label">{t('jobReason')}</span>
              <input className="input" placeholder="..." value={reasonStr} onChange={e => setReasonStr(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleComplete} disabled={!jobIdInput || !reasonStr}>COMPLETE_JOB()</button>
          </div>
        )}

      </div>
    </section>
  )
}
