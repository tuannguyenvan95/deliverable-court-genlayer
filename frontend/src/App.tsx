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
    <div>
      <header className="header">
        <div className="logo flex items-center gap-2">
          <Gavel size={28} color="#3b82f6" />
          DeliverableCourt
        </div>
        <div>
          {account ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              <Wallet size={18} /> Connect Wallet
            </button>
          )}
        </div>
      </header>

      {!CONTRACT_ADDRESS && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '1rem' }}>
            <AlertTriangle />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Contract Not Configured</h3>
          </div>
          <p>Please deploy the contract on GenLayer Studio and set <code>VITE_CONTRACT_ADDRESS</code> in your <code>.env</code> file.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Col: Create Job */}
        <div>
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} /> Create New Job
            </h2>
            <form onSubmit={createJob}>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input required className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Logo Design" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea required className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Brief URL (Public)</label>
                <input required type="url" className="form-input" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Escrow Amount (wei)</label>
                <input required type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000000000000000" />
              </div>
              <button disabled={loading || !account || !CONTRACT_ADDRESS} type="submit" className="btn btn-primary w-full" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <span className="loader"></span> : 'Fund & Create Job'}
              </button>
            </form>
          </div>

          {activeJobId && (
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Submit Deliverable</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Job ID: {activeJobId}</p>
              <form onSubmit={submitDeliverable}>
                <div className="form-group">
                  <label className="form-label">Deliverable URL (Public)</label>
                  <input required type="url" className="form-input" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://figma.com/..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for the client/judge..."></textarea>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    {loading ? <span className="loader"></span> : 'Submit'}
                  </button>
                  <button type="button" onClick={() => setActiveJobId(null)} className="btn" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Col: Job List */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Active Jobs</h2>
          {jobs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '1rem' }}>
              No jobs found. Create one to get started.
            </div>
          ) : (
            <div className="job-list">
              {jobs.map(job => (
                <div key={job.id} className="card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{job.title}</h3>
                    <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{job.description}</p>
                  
                  <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Client:</strong> {job.client.slice(0,6)}...</div>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Amount:</strong> {job.amount} wei</div>
                    <div style={{ marginBottom: '0.5rem' }}><strong>Brief:</strong> <a href={job.brief_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>View</a></div>
                    {job.deliverable_url && (
                      <div><strong>Deliverable:</strong> <a href={job.deliverable_url.split('\\n')[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>View</a></div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {job.status === 'OPEN' && (
                      <button onClick={() => acceptJob(job.id)} disabled={loading || !account || account.toLowerCase() === job.client.toLowerCase()} className="btn w-full" style={{ justifyContent: 'center' }}>
                        Accept Job
                      </button>
                    )}
                    
                    {job.status === 'IN_PROGRESS' && account?.toLowerCase() === job.freelancer.toLowerCase() && (
                      <button onClick={() => setActiveJobId(job.id)} disabled={loading} className="btn w-full" style={{ justifyContent: 'center' }}>
                        Submit Work
                      </button>
                    )}
                    
                    {job.status === 'IN_PROGRESS' && job.deliverable_url && (
                      <button onClick={() => adjudicate(job.id)} disabled={loading} className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                        <Gavel size={16} /> Adjudicate (AI)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Toast / Global Loading Overlay could go here */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="loader" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
            <p style={{ fontWeight: 'bold' }}>Waiting for GenLayer Consensus...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This may take a moment while the AI validators reach agreement.</p>
          </div>
        </div>
      )}
    </div>
  );
}
