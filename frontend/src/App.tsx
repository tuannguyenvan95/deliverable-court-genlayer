import { useState, useEffect } from 'react';
import { client } from './genlayer';
import { 
  Gavel, 
  Briefcase, 
  AlertTriangle,
  Wallet
} from 'lucide-react';
import './index.css';

// We use the contract address from env
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [amount, setAmount] = useState('');
  
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);


  useEffect(() => {
    // In a real app we'd fetch the job list, but GenLayer Simulator might not have get_all_jobs yet
    // For this demo, we'll track jobs manually or just assume we know the IDs
    // Assuming the user will create a job and we append to state
  }, []);

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert('Please install MetaMask');
        return;
      }
      
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      // Request switch to studionet
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xf22f' }], // 61999 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xf22f',
                chainName: 'GenLayer StudioNet',
                rpcUrls: ['https://rpc.genlayer.com/studionet'], // Placeholder, replace with actual if needed
                nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
              },
            ],
          });
        }
      }
      
      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!CONTRACT_ADDRESS) return alert('Contract address not set in .env');
    
    setLoading(true);
    try {
      // In genlayer-js we interact with the contract
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'create_job',
        args: [title, desc, briefUrl],
        value: BigInt(amount), 
        account: account as any,
      });
      
      await client.waitForTransactionReceipt({ hash: tx });
      
      // Add to local state (mocking an ID since we can't easily parse events here)
      const newJob = {
        id: jobs.length.toString(),
        title,
        description: desc,
        brief_url: briefUrl,
        amount: amount,
        client: account,
        freelancer: '0x0000000000000000000000000000000000000000',
        status: 'OPEN',
        deliverable_url: ''
      };
      
      setJobs([...jobs, newJob]);
      setTitle(''); setDesc(''); setBriefUrl(''); setAmount('');
      alert('Job created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create job');
    }
    setLoading(false);
  };

  const acceptJob = async (id: string) => {
    setLoading(true);
    try {
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'accept_job',
        args: [id],
        value: 0n,
        account: account as any,
      });
      await client.waitForTransactionReceipt({ hash: tx });
      
      setJobs(jobs.map(j => j.id === id ? { ...j, status: 'IN_PROGRESS', freelancer: account } : j));
      alert('Job accepted!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept job');
    }
    setLoading(false);
  };

  const submitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    setLoading(true);
    try {
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'submit_deliverable',
        args: [activeJobId, deliverableUrl, notes],
        value: 0n,
        account: account as any,
      });
      await client.waitForTransactionReceipt({ hash: tx });
      
      setJobs(jobs.map(j => j.id === activeJobId ? { ...j, deliverable_url: deliverableUrl + "\\nNotes: " + notes } : j));
      setActiveJobId(null);
      setDeliverableUrl('');
      setNotes('');
      alert('Deliverable submitted!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit deliverable');
    }
    setLoading(false);
  };

  const adjudicate = async (id: string) => {
    setLoading(true);
    setLoading(true);
    try {
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'adjudicate',
        args: [id],
        value: 0n,
        account: account as any,
      });
      
      await client.waitForTransactionReceipt({ hash: tx });
      
      // Attempt to read the returned data (in a real scenario we might need to query the contract state or parse logs)
      // Since it's a demo, we will just read the job state to see if it closed
      await client.readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'jobs',
        args: [id]
      });
      
      alert('Adjudication complete. Check console for details.');
      
      setJobs(jobs.map(j => j.id === id ? { ...j, status: 'CLOSED' } : j)); // Simplified
    } catch (err) {
      console.error(err);
      alert('Failed to adjudicate');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Animated Background */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div>
        <header className="header">
          <div className="logo">
            <Gavel size={32} color="var(--accent-cyan)" />
            DeliverableCourt
          </div>
          <div>
            {account ? (
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={connectWallet} style={{ borderRadius: '2rem' }}>
                <Wallet size={18} /> Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <h1>AI-Powered Escrow</h1>
          <p>Resolve freelancer disputes instantly. Submit your brief, fund the escrow, and let GenLayer's intelligent validators adjudicate the deliverable fairly.</p>
        </section>

        {!CONTRACT_ADDRESS && (
          <div className="card" style={{ borderColor: 'var(--warning)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--warning)', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Contract Not Configured</h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Please deploy the contract on GenLayer Studio and set <code style={{background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px'}}>VITE_CONTRACT_ADDRESS</code> in your <code>.env</code> file.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Left Col: Create Job / Submit Deliverable */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
              <h2 className="card-title">
                <Briefcase size={24} color="var(--accent-purple)" /> 
                Create New Job
              </h2>
              <form onSubmit={createJob}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input required className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Modern UI Design" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea required className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description of the work..."></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Brief URL (Public Document)</label>
                  <input required type="url" className="form-input" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Escrow Amount (wei)</label>
                  <input required type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000000000000000" />
                </div>
                <button disabled={loading || !account || !CONTRACT_ADDRESS} type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Fund & Create Job
                </button>
              </form>
            </div>

            {activeJobId && (
              <div className="card" style={{ borderColor: 'var(--accent-cyan)', boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)' }}>
                <h2 className="card-title" style={{ color: 'var(--accent-cyan)' }}>Submit Deliverable</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Job ID: <strong>{activeJobId}</strong></p>
                <form onSubmit={submitDeliverable}>
                  <div className="form-group">
                    <label className="form-label">Deliverable URL (Public)</label>
                    <input required type="url" className="form-input" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://figma.com/..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes for AI Validator</label>
                    <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain how you met the brief requirements..."></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                      Submit Work
                    </button>
                    <button type="button" onClick={() => setActiveJobId(null)} className="btn" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Col: Job List */}
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: '800' }}>Active Escrows</h2>
            {jobs.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '1.5rem' }}>
                <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                  <Briefcase size={48} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Jobs Found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Create a new job to start utilizing intelligent escrow.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {jobs.map(job => (
                  <div key={job.id} className="card" style={{ marginBottom: 0, padding: '2rem' }}>
                    <div className="job-card-header">
                      <h3 className="job-card-title">{job.title}</h3>
                      <span className={`status-badge status-${job.status}`}>{job.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{job.description}</p>
                    
                    <div className="job-meta">
                      <div className="job-meta-row">
                        <span className="job-meta-label">Client</span>
                        <span className="job-meta-value">{job.client.slice(0,6)}...{job.client.slice(-4)}</span>
                      </div>
                      <div className="job-meta-row">
                        <span className="job-meta-label">Amount</span>
                        <span className="job-meta-value gradient-text">{job.amount} wei</span>
                      </div>
                      <div className="job-meta-row">
                        <span className="job-meta-label">Project Brief</span>
                        <a href={job.brief_url} target="_blank" rel="noreferrer" className="job-meta-link">View Docs</a>
                      </div>
                      {job.deliverable_url && (
                        <div className="job-meta-row">
                          <span className="job-meta-label">Deliverable</span>
                          <a href={job.deliverable_url.split('\n')[0]} target="_blank" rel="noreferrer" className="job-meta-link">Review Work</a>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {job.status === 'OPEN' && (
                        <button onClick={() => acceptJob(job.id)} disabled={loading || !account || account.toLowerCase() === job.client.toLowerCase()} className="btn w-full" style={{ width: '100%' }}>
                          Accept Job
                        </button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && account?.toLowerCase() === job.freelancer.toLowerCase() && (
                        <button onClick={() => setActiveJobId(job.id)} disabled={loading} className="btn w-full" style={{ width: '100%' }}>
                          Submit Deliverable
                        </button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && job.deliverable_url && (
                        <button onClick={() => adjudicate(job.id)} disabled={loading} className="btn btn-primary w-full" style={{ width: '100%', fontSize: '1.1rem' }}>
                          <Gavel size={20} /> AI Adjudicate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="loading-overlay">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>GenLayer Consensus</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>Validators are analyzing the deliverable against the project brief using Intelligent Smart Contracts.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
