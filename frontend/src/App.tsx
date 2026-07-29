import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Gavel, Wallet, Briefcase, FileText, CheckCircle, AlertTriangle, LayoutDashboard, Settings, ChevronRight, Zap } from 'lucide-react';
import './index.css';

// HARDCODED to avoid any Vercel environment undefined issues
const CONTRACT_ADDRESS = "0x41A52a8C1130E0e3f2A6A2e3EF2512c27776aC76";

const client = createClient({
  chain: studionet,
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

  const clearError = () => {
    setTimeout(() => setErrorMsg(null), 5000);
  };

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
      clearError();
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
      clearError();
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
      clearError();
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
      clearError();
    }
    setLoading(false);
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const closedJobs = jobs.filter(j => j.status === 'CLOSED').length;

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden font-sans">
      
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none translate-x-1/3 translate-y-1/3 animate-pulse"></div>

      {/* Sidebar Navigation */}
      <aside className="w-72 bg-surface/80 backdrop-blur-2xl border-r border-border/50 flex flex-col p-6 relative z-10">
        <div className="flex items-center gap-3 text-2xl font-bold text-white mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <Gavel size={24} className="text-white" />
          </div>
          <span className="tracking-tight text-gradient">GenLayerCourt</span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-primary/10 text-white border border-primary/20 shadow-[inset_0_0_20px_rgba(177,85,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-primary' : ''} /> Overview Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'jobs' ? 'bg-primary/10 text-white border border-primary/20 shadow-[inset_0_0_20px_rgba(177,85,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Briefcase size={18} className={activeTab === 'jobs' ? 'text-primary' : ''} /> Escrow Contracts
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 border border-transparent">
            <Settings size={18} /> Protocol Settings
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-border/50">
          {account ? (
            <div className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform">
                <Wallet size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">Connected Wallet</span>
                <span className="text-sm font-bold text-white font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="w-full relative group overflow-hidden rounded-xl bg-surface border border-border/50 p-4 transition-all duration-300 hover:border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-2 text-white font-semibold">
                <Wallet size={18} /> Connect Web3 Wallet
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10 scroll-smooth">
        
        {/* Error Notification Float */}
        {errorMsg && (
          <div className="fixed top-6 right-6 z-50 animate-[float_3s_ease-in-out_infinite]">
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-start gap-4 max-w-md">
              <AlertTriangle size={24} className="shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-red-300">Transaction Failed</span>
                <span className="text-sm leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          </div>
        )}

        <header className="px-10 py-8 flex justify-between items-center sticky top-0 bg-background/60 backdrop-blur-xl border-b border-border/30 z-40">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {activeTab === 'dashboard' ? 'Overview' : 'Escrow Contracts'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Intelligent dispute resolution powered by GenLayer.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full glass-card flex items-center gap-2 text-sm font-medium text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
              Network: GenLayer StudioNet
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl w-full mx-auto pb-24">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase size={64} /></div>
                  <h3 className="text-gray-400 font-medium mb-2">Total Escrows</h3>
                  <div className="text-5xl font-bold text-white">{totalJobs}</div>
                </div>
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 text-yellow-500 transition-opacity"><Zap size={64} /></div>
                  <h3 className="text-gray-400 font-medium mb-2">In Progress</h3>
                  <div className="text-5xl font-bold text-yellow-500">{activeJobs}</div>
                </div>
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-green-500/20">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 text-green-500 transition-opacity"><CheckCircle size={64} /></div>
                  <h3 className="text-gray-400 font-medium mb-2">Adjudicated</h3>
                  <div className="text-5xl font-bold text-green-400">{closedJobs}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Create Job Form */}
                <div className="xl:col-span-5">
                  <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Briefcase className="text-primary" size={22} /> Deploy New Escrow
                    </h2>
                    
                    <form onSubmit={createJob} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Project Title</label>
                        <input required className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Smart Contract Audit" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <textarea required className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px] resize-y" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detailed requirements..."></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Brief Document URL (Public)</label>
                        <input required type="url" className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Escrow Amount (Wei)</label>
                        <input required type="number" className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000000000000000" />
                      </div>
                      
                      <button disabled={loading || !account} type="submit" className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-4">
                        <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-70 group-hover:opacity-100 transition-opacity"></span>
                        <div className="relative bg-background/80 backdrop-blur-xl px-6 py-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-transparent transition-colors">
                          <span className="font-bold text-white">Create & Fund Escrow</span>
                          <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Column / Submit Deliverable Context */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  {activeJobId ? (
                    <div className="glass-panel rounded-3xl p-8 border-primary/30 relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                      
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <FileText className="text-primary" size={24} /> Submit Deliverable
                      </h2>
                      <p className="text-gray-400 mb-8 flex items-center gap-2">
                        Targeting Job ID: <span className="font-mono bg-black/50 px-3 py-1 rounded-lg text-primary">{activeJobId}</span>
                      </p>
                      
                      <form onSubmit={submitDeliverable} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Deliverable URL (Public Resource)</label>
                          <input required type="url" className="w-full bg-black/60 border border-border/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Execution Notes for AI Validator</label>
                          <textarea className="w-full bg-black/60 border border-border/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain how you fulfilled the requirements..."></textarea>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button type="submit" disabled={loading} className="flex-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-colors flex-grow text-center">
                            Submit Final Work
                          </button>
                          <button type="button" onClick={() => setActiveJobId(null)} className="flex-1 bg-surface border border-border/50 text-white hover:bg-white/5 px-8 py-4 rounded-xl font-bold transition-colors">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-3xl flex flex-col items-center justify-center min-h-[400px] border-dashed text-gray-500 text-center px-10">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Briefcase size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Context</h3>
                      <p className="max-w-md">Navigate to the "Escrow Contracts" tab to browse available jobs or select a job to submit your deliverable.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {jobs.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 text-center text-gray-400 border-dashed border-2 border-border/50 flex flex-col items-center">
                   <Briefcase size={48} className="mb-4 text-gray-600" />
                   <h3 className="text-2xl font-bold text-gray-300 mb-2">No Escrows Found</h3>
                   <p>Be the first to create a secure job escrow on the network.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="glass-panel rounded-3xl p-8 hover:border-primary/40 transition-all duration-300 relative overflow-hidden group">
                    
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-colors"></div>

                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                      
                      {/* Job Info */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
                            job.status === 'OPEN' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            job.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 leading-relaxed mb-6 flex-1">
                          {job.description}
                        </p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/40 rounded-2xl p-4 border border-white/5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Client Address</span>
                            <span className="font-mono text-sm text-gray-200">{job.client.slice(0,6)}...{job.client.slice(-4)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Escrow Amount</span>
                            <span className="font-mono text-sm text-primary font-bold">{job.amount} WEI</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Brief</span>
                            <a href={job.brief_url} target="_blank" rel="noreferrer" className="text-sm text-secondary hover:underline flex items-center gap-1">View Docs <ChevronRight size={14} /></a>
                          </div>
                          {job.deliverable_url && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Deliverable</span>
                              <a href={job.deliverable_url.split('\n')[0]} target="_blank" rel="noreferrer" className="text-sm text-green-400 hover:underline flex items-center gap-1">Review Work <ChevronRight size={14} /></a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Panel */}
                      <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-border/50 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center gap-4">
                        {job.status === 'OPEN' && (
                          <button onClick={() => acceptJob(job.id)} disabled={loading || !account || account.toLowerCase() === job.client.toLowerCase()} className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            Accept Escrow
                          </button>
                        )}
                        
                        {job.status === 'IN_PROGRESS' && account?.toLowerCase() === job.freelancer.toLowerCase() && (
                          <button onClick={() => { setActiveJobId(job.id); setActiveTab('dashboard'); }} disabled={loading} className="w-full bg-surface border border-border/50 text-white hover:bg-white/10 px-6 py-4 rounded-xl font-bold transition-colors">
                            Submit Work
                          </button>
                        )}
                        
                        {job.status === 'IN_PROGRESS' && job.deliverable_url && (
                          <button onClick={() => adjudicate(job.id)} disabled={loading} className="w-full relative group overflow-hidden rounded-xl p-[1px]">
                            <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-100 group-hover:scale-110 transition-transform duration-500"></span>
                            <div className="relative bg-background/50 backdrop-blur-sm px-6 py-4 flex flex-col items-center gap-1 group-hover:bg-transparent transition-colors">
                              <Gavel size={24} className="text-white" />
                              <span className="font-bold text-white">AI Adjudicate</span>
                            </div>
                          </button>
                        )}

                        {job.status === 'CLOSED' && (
                          <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                            <CheckCircle size={24} />
                            Resolution Complete
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Futuristic Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-secondary rounded-full animate-[spin_2s_reverse_infinite]"></div>
            <div className="absolute inset-4 border-b-2 border-white rounded-full animate-[spin_3s_linear_infinite]"></div>
            <Gavel size={32} className="text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">GenLayer Consensus</h2>
          <p className="text-gray-400 max-w-md text-center">Intelligent Smart Contracts are analyzing the context and resolving the escrow transaction.</p>
        </div>
      )}
    </div>
  );
}
