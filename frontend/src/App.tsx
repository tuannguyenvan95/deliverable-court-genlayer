import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studio } from 'genlayer-js/chains';
import { Gavel, Wallet, Briefcase, FileText, CheckCircle, AlertTriangle, LayoutDashboard, Settings } from 'lucide-react';
import './index.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const client = createClient({
  chain: studio,
});

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Job creation form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [amount, setAmount] = useState('');

  // Submit deliverable form
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask or a Web3 wallet is required');
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect wallet');
    }
  };

  const fetchJobs = async () => {
    if (!CONTRACT_ADDRESS) return;
    try {
      const allJobsStr: string = await client.readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'get_all_jobs',
        args: [],
      }) as string;
      const allJobs = JSON.parse(allJobsStr);
      const jobsArray = Object.entries(allJobs).map(([id, job]: [string, any]) => ({
        id,
        ...job
      }));
      setJobs(jobsArray.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return setErrorMsg('Connect wallet first');
    setLoading(true);
    setErrorMsg(null);
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'create_job',
        args: [title, desc, briefUrl],
        value: BigInt(amount),
        account: account as any,
      });
      setTitle(''); setDesc(''); setBriefUrl(''); setAmount('');
      await fetchJobs();
      setActiveTab('jobs');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to create job: ${err.message || err.toString()}`);
    }
    setLoading(false);
  };

  const acceptJob = async (jobId: string) => {
    if (!account) return setErrorMsg('Connect wallet first');
    setLoading(true);
    setErrorMsg(null);
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'accept_job',
        args: [jobId],
        value: 0n,
        account: account as any,
      });
      await fetchJobs();
    } catch (err: any) {
      setErrorMsg(`Failed to accept job: ${err.message || err.toString()}`);
    }
    setLoading(false);
  };

  const submitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !activeJobId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'submit_deliverable',
        args: [activeJobId, deliverableUrl, notes],
        value: 0n,
        account: account as any,
      });
      setActiveJobId(null);
      setDeliverableUrl('');
      setNotes('');
      await fetchJobs();
    } catch (err: any) {
      setErrorMsg(`Failed to submit work: ${err.message || err.toString()}`);
    }
    setLoading(false);
  };

  const adjudicate = async (jobId: string) => {
    if (!account) return setErrorMsg('Connect wallet first');
    setLoading(true);
    setErrorMsg(null);
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'adjudicate',
        args: [jobId],
        value: 0n,
        account: account as any,
      });
      await fetchJobs();
    } catch (err: any) {
      setErrorMsg(`Failed to run AI Validator: ${err.message || err.toString()}`);
    }
    setLoading(false);
  };

  // Derived Stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const closedJobs = jobs.filter(j => j.status === 'CLOSED').length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Gavel size={24} color="var(--accent-color)" />
          DeliverableCourt
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
            <Briefcase size={18} /> All Escrows
          </div>
          <div className="nav-item">
            <Settings size={18} /> Settings
          </div>
        </nav>

        <div className="sidebar-footer">
          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#000', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
              <div className="status-dot"></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connected</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              <Wallet size={18} /> Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1 className="page-title">
            {activeTab === 'dashboard' ? 'Overview' : 'Escrow Contracts'}
          </h1>
          <div className="wallet-badge">
            <span style={{ color: 'var(--text-secondary)' }}>Network:</span> GenLayer Studio
          </div>
        </header>

        <div className="dashboard-content">
          {!CONTRACT_ADDRESS && (
            <div className="alert-error" style={{ marginBottom: '2rem' }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Contract Not Configured:</strong> Please deploy the contract on GenLayer Studio and set <code style={{background: '#000', padding: '0.1rem 0.3rem', borderRadius: '4px'}}>VITE_CONTRACT_ADDRESS</code> in your .env file.
              </div>
            </div>
          )}
          
          {errorMsg && (
            <div className="alert-error">
              <AlertTriangle size={20} />
              <div>
                <strong>Transaction Failed:</strong> {errorMsg}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Escrows Created</div>
                  <div className="stat-value">{totalJobs}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active / In Progress</div>
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>{activeJobs}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Closed / Adjudicated</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>{closedJobs}</div>
                </div>
              </div>

              <div className="content-grid">
                {/* Create Job Form */}
                <div className="panel">
                  <h2 className="panel-title"><Briefcase size={20} color="var(--text-secondary)" /> Create New Job</h2>
                  <form onSubmit={createJob}>
                    <div className="form-group">
                      <label className="form-label">Job Title</label>
                      <input required className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Smart Contract Audit" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea required className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the requirements..."></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Brief URL (Public)</label>
                      <input required type="url" className="form-input" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Escrow Amount (wei)</label>
                      <input required type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000000000000000" />
                    </div>
                    <button disabled={loading || !account || !CONTRACT_ADDRESS} type="submit" className="btn btn-glow">
                      Deploy to GenLayer Escrow
                    </button>
                  </form>
                </div>

                {/* Submit Deliverable Form (if active) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {activeJobId ? (
                    <div className="panel" style={{ borderColor: 'var(--accent-color)' }}>
                      <h2 className="panel-title"><FileText size={20} color="var(--accent-color)" /> Submit Deliverable</h2>
                      <div style={{ background: '#000', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        Submitting for Job ID: <strong>{activeJobId}</strong>
                      </div>
                      <form onSubmit={submitDeliverable}>
                        <div className="form-group">
                          <label className="form-label">Deliverable URL (Public)</label>
                          <input required type="url" className="form-input" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Notes for AI Validator</label>
                          <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain how you met the brief..."></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>Submit Work</button>
                          <button type="button" onClick={() => setActiveJobId(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)', borderStyle: 'dashed' }}>
                      Select a job from "All Escrows" to submit deliverables.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'jobs' && (
            <div className="jobs-list">
              {jobs.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-subtle)', borderRadius: '1rem' }}>
                  No jobs found in the network.
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-main">
                      <div className="job-title-row">
                        <h3 className="job-title">{job.title}</h3>
                        <span className={`status-badge status-${job.status}`}>{job.status}</span>
                      </div>
                      <p className="job-desc">{job.description}</p>
                      
                      <div className="job-meta-grid">
                        <div className="meta-item">
                          <span className="meta-label">Client</span>
                          <span className="meta-val">{job.client.slice(0,8)}...</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Amount (Wei)</span>
                          <span className="meta-val">{job.amount}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Project Brief</span>
                          <a href={job.brief_url} target="_blank" rel="noreferrer" className="meta-link">View Document</a>
                        </div>
                        {job.deliverable_url && (
                          <div className="meta-item">
                            <span className="meta-label">Deliverable</span>
                            <a href={job.deliverable_url.split('\n')[0]} target="_blank" rel="noreferrer" className="meta-link">Review Work</a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="job-actions">
                      {job.status === 'OPEN' && (
                        <button onClick={() => acceptJob(job.id)} disabled={loading || !account || account.toLowerCase() === job.client.toLowerCase()} className="btn btn-primary">
                          <CheckCircle size={16} /> Accept Job
                        </button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && account?.toLowerCase() === job.freelancer.toLowerCase() && (
                        <button onClick={() => setActiveJobId(job.id)} disabled={loading} className="btn btn-secondary">
                          <FileText size={16} /> Submit Work
                        </button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && job.deliverable_url && (
                        <button onClick={() => adjudicate(job.id)} disabled={loading} className="btn btn-glow" style={{ fontSize: '1rem', padding: '1rem' }}>
                          <Gavel size={20} /> AI Adjudicate
                        </button>
                      )}

                      {job.status === 'CLOSED' && (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                          <CheckCircle size={18} /> Resolution Complete
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Global Loading Overlay */}
      {loading && (
        <div className="global-loading">
          <div className="spinner"></div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Awaiting GenLayer Consensus</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>Validators are executing intelligent smart contracts. This may take a few moments.</p>
          </div>
        </div>
      )}
    </div>
  );
}
