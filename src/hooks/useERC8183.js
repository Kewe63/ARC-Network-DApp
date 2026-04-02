import { useState, useCallback } from 'react'
import { Contract, ethers } from 'ethers'

const AGENTIC_COMMERCE_ADDRESS = "0x0747EEf0706327138c69792bF28Cd525089e4583"
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"

const AGENTIC_COMMERCE_ABI = [
  "function createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook) returns(uint256)",
  "function setBudget(uint256 jobId, uint256 amount, bytes optParams)",
  "function fund(uint256 jobId, bytes optParams)",
  "function submit(uint256 jobId, bytes32 deliverable, bytes optParams)",
  "function complete(uint256 jobId, bytes32 reason, bytes optParams)",
  "function getJob(uint256 jobId) view returns (tuple(uint256 id, address client, address provider, address evaluator, string description, uint256 budget, uint256 expiredAt, uint8 status, address hook))",
  "event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider, address evaluator, uint256 expiredAt, address hook)"
]

const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
]

export function useERC8183(signer, address) {
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  const fetchMyJobs = useCallback(async () => {
    if (!signer || !address) return
    setLoadingJobs(true)
    try {
      const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
      const filter = contract.filters.JobCreated(null, address) // client is the second param in ABI
      const events = await contract.queryFilter(filter)
      
      const jobPromises = events.map(async (event) => {
        const jobId = event.args[0]
        const job = await contract.getJob(jobId)
        return {
          id: job.id.toString(),
          client: job.client,
          provider: job.provider,
          evaluator: job.evaluator,
          description: job.description,
          budget: job.budget, // Keep as BigInt
          expiredAt: job.expiredAt.toString(),
          status: Number(job.status),
          hook: job.hook
        }
      })
      const resolvedJobs = await Promise.all(jobPromises)
      // Reverse to show newest jobs first
      setJobs(resolvedJobs.reverse())
    } catch (e) {
      console.error('Error fetching jobs:', e)
    }
    setLoadingJobs(false)
  }, [signer, address])

  const createJob = async (providerAddress, description, expirationHours) => {
    if (!signer) throw new Error("No wallet connected")
    const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
    const expiredAt = Math.floor(Date.now() / 1000) + (expirationHours * 3600)
    // We set evaluator as ourselves (the creator)
    const tx = await contract.createJob(providerAddress, address, expiredAt, description, ethers.ZeroAddress)
    return await tx.wait()
  }

  const setBudget = async (jobId, budgetAmountRaw) => {
    if (!signer) throw new Error("No wallet connected")
    const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
    const tx = await contract.setBudget(jobId, budgetAmountRaw, "0x")
    return await tx.wait()
  }

  const fundJob = async (jobId, amountRaw) => {
    if (!signer) throw new Error("No wallet connected")
    const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer)
    const approveTx = await usdc.approve(AGENTIC_COMMERCE_ADDRESS, amountRaw)
    await approveTx.wait()

    const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
    const fundTx = await contract.fund(jobId, "0x")
    return await fundTx.wait()
  }

  const submitJob = async (jobId, deliverableString) => {
    if (!signer) throw new Error("No wallet connected")
    const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
    const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes(deliverableString))
    const tx = await contract.submit(jobId, deliverableHash, "0x")
    return await tx.wait()
  }

  const completeJob = async (jobId, reasonString) => {
    if (!signer) throw new Error("No wallet connected")
    const contract = new Contract(AGENTIC_COMMERCE_ADDRESS, AGENTIC_COMMERCE_ABI, signer)
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(reasonString))
    const tx = await contract.complete(jobId, reasonHash, "0x")
    return await tx.wait()
  }

  return {
    AGENTIC_COMMERCE_ADDRESS,
    jobs,
    loadingJobs,
    fetchMyJobs,
    createJob,
    setBudget,
    fundJob,
    submitJob,
    completeJob
  }
}
