import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Gavel, Wallet, Briefcase, FileText, CheckCircle, AlertTriangle, LayoutDashboard, Settings, ChevronRight, Zap, Brain, Server, Shield, Globe, Code2, Cpu } from 'lucide-react';
import './index.css';

const CONTRACT_ADDRESS = "0xfd1E3De1f66fc7c119C205ee81aA23a5d012Bb79";

export default function App() {
  const [client, setClient] = useState<any>(null);
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

  useEffect(() => {
    // Initialize default client for reading
    const initClient = createClient({
      chain: studionet,
      provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined
    });
    setClient(initClient);
    
    // Check if already connected
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }).catch(console.error);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask or a Web3 wallet is required');
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      // Re-init client to ensure provider is attached
      const newClient = createClient({
        chain: studionet,
        provider: (window as any).ethereum
      });
      setClient(newClient);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect wallet');
    }
  };

  const fetchJobs = async () => {
    if (!CONTRACT_ADDRESS || !client) return;
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
      console.error("Fetch jobs error:", err);
    }
  };

  useEffect(() => {
    if (client) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [client]);

  const clearError = () => {
    setTimeout(() => setErrorMsg(null), 7000);
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
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none translate-x-1/3 translate-y-1/3 animate-pulse"></div>

      {/* Sidebar Navigation */}
      <aside className="w-72 bg-surface/80 backdrop-blur-2xl border-r border-border/50 flex flex-col p-6 relative z-30 shadow-2xl h-screen sticky top-0 shrink-0">
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
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'settings' ? 'bg-primary/10 text-white border border-primary/20 shadow-[inset_0_0_20px_rgba(177,85,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Settings size={18} className={activeTab === 'settings' ? 'text-primary' : ''} /> Protocol Settings
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
      <div className="flex-1 flex flex-col min-h-screen relative z-10 w-full overflow-hidden">
        
        <div className="flex-1 overflow-y-auto w-full flex flex-col">
          {/* Error Notification Float */}
          {errorMsg && (
            <div className="fixed top-6 right-6 z-50 animate-[float_3s_ease-in-out_infinite]">
              <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-start gap-4 max-w-md">
                <AlertTriangle size={24} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-red-300">Transaction Error</span>
                  <span className="text-sm leading-relaxed">{errorMsg}</span>
                </div>
              </div>
            </div>
          )}

          <header className="px-10 py-8 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/30 z-40 shrink-0">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' ? 'Overview' : activeTab === 'jobs' ? 'Escrow Contracts' : 'Protocol Configurations'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Intelligent dispute resolution powered by GenLayer LLM.</p>
            </div>
            
            <div className="flex items-center gap-4 hidden md:flex">
              <div className="px-4 py-2 rounded-full glass-card flex items-center gap-2 text-sm font-medium text-gray-300 border-primary/20">
                <Brain size={16} className="text-primary" />
                AI Evaluator Active
              </div>
              <div className="px-4 py-2 rounded-full glass-card flex items-center gap-2 text-sm font-medium text-gray-300 border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                StudioNet
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10 max-w-7xl w-full mx-auto flex-1 pb-10">
            
            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 text-primary">
                    <Server size={200} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Shield className="text-primary" size={28} /> Protocol Core Settings
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="bg-black/40 border border-border/50 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Smart Contract Address</h3>
                      <div className="flex items-center gap-3">
                        <code className="text-lg text-white font-mono bg-white/5 px-4 py-2 rounded-xl flex-1">{CONTRACT_ADDRESS}</code>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 border border-border/50 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">GenLayer RPC Endpoint</h3>
                      <div className="flex items-center gap-3">
                        <code className="text-lg text-white font-mono bg-white/5 px-4 py-2 rounded-xl flex-1">https://studio.genlayer.com/rpc</code>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 md:col-span-2 flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Brain size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">GenLayer AI Validator (LLM)</h3>
                        <p className="text-gray-300">The protocol uses GenLayer's built-in non-deterministic LLM consensus to evaluate design (Figma), code (GitHub), and docs (Notion) directly from URLs without human intervention.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DASHBOARD TAB */}
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

                {/* HOW IT WORKS WORKFLOW */}
                <div className="glass-panel rounded-3xl p-8 mb-10 border-primary/20">
                  <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <Cpu className="text-primary" size={22} /> How GenLayerCourt Works
                  </h2>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-border/50 -translate-y-1/2 z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 w-48 text-center bg-background/80 p-2 rounded-xl backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 font-bold">1</div>
                      <h4 className="font-bold text-white">Create Escrow</h4>
                      <p className="text-xs text-gray-400">Client deposits crypto & links Notion/Figma Brief.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-48 text-center bg-background/80 p-2 rounded-xl backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/30 font-bold">2</div>
                      <h4 className="font-bold text-white">Accept & Build</h4>
                      <p className="text-xs text-gray-400">Freelancer accepts and submits final GitHub/Figma URL.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-48 text-center bg-background/80 p-2 rounded-xl backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30 font-bold">
                        <Brain size={20} />
                      </div>
                      <h4 className="font-bold text-white text-gradient">AI Adjudication</h4>
                      <p className="text-xs text-gray-400">GenLayer LLM reads both URLs and evaluates quality.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-48 text-center bg-background/80 p-2 rounded-xl backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30 font-bold">
                        <CheckCircle size={20} />
                      </div>
                      <h4 className="font-bold text-white">Auto Release</h4>
                      <p className="text-xs text-gray-400">Funds released, partially refunded, or fully refunded based on AI verdict.</p>
                    </div>
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
                          <input required className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. High-end UI Design (Figma)" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Scope of Work</label>
                          <textarea required className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px] resize-y" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detailed requirements for the AI to judge against..."></textarea>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Original Brief (Public URL)</label>
                          <input required type="url" className="w-full bg-black/40 border border-border/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/... or Notion link" />
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
                          <FileText className="text-primary" size={24} /> Submit Final Deliverable
                        </h2>
                        <p className="text-gray-400 mb-8 flex items-center gap-2">
                          Targeting Job ID: <span className="font-mono bg-black/50 px-3 py-1 rounded-lg text-primary">{activeJobId}</span>
                        </p>
                        
                        <form onSubmit={submitDeliverable} className="space-y-6 relative z-10">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Deliverable Asset URL (Figma, GitHub, Notion)</label>
                            <input required type="url" className="w-full bg-black/60 border border-border/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://www.figma.com/..." />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Pitch & Notes for AI Evaluator</label>
                            <textarea className="w-full bg-black/60 border border-border/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain to the GenLayer LLM how your work meets the original brief..."></textarea>
                          </div>
                          <div className="flex gap-4 pt-4">
                            <button type="submit" disabled={loading} className="flex-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-colors flex-grow text-center">
                              Submit to Protocol
                            </button>
                            <button type="button" onClick={() => setActiveJobId(null)} className="flex-1 bg-surface border border-border/50 text-white hover:bg-white/5 px-8 py-4 rounded-xl font-bold transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="glass-panel rounded-3xl flex flex-col items-center justify-center min-h-[400px] border-dashed text-gray-500 text-center px-10">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                          <div className="absolute inset-0 border border-white/10 rounded-full animate-ping opacity-20"></div>
                          <Brain size={40} className="text-primary/50" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">AI Awaiting Context</h3>
                        <p className="max-w-md">Navigate to the "Escrow Contracts" tab to browse available jobs or select an In-Progress job to submit your deliverable for LLM evaluation.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* JOBS TAB */}
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
                          <div className="flex flex-col mb-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                              <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${
                                job.status === 'OPEN' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                job.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                                {job.status}
                              </span>
                            </div>

                            {/* Job Progress Bar */}
                            <div className="mt-4 flex items-center gap-2">
                              <div className={`h-1.5 flex-1 rounded-full ${job.status !== 'OPEN' ? 'bg-green-500' : 'bg-green-500'}`}></div>
                              <div className={`h-1.5 flex-1 rounded-full ${job.status === 'IN_PROGRESS' || job.status === 'CLOSED' ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                              <div className={`h-1.5 flex-1 rounded-full ${job.status === 'CLOSED' ? 'bg-primary' : 'bg-gray-700'}`}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-gray-500 uppercase font-bold px-1">
                              <span>Funded</span>
                              <span className="text-center pl-8">Building</span>
                              <span className="text-right">Adjudicated</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 leading-relaxed mb-6 flex-1">
                            {job.description}
                          </p>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/40 rounded-2xl p-4 border border-white/5 mb-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Client</span>
                              <span className="font-mono text-sm text-gray-200">{job.client.slice(0,6)}...{job.client.slice(-4)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Amount</span>
                              <span className="font-mono text-sm text-primary font-bold">{job.amount} WEI</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Original Brief</span>
                              <a href={job.brief_url} target="_blank" rel="noreferrer" className="text-sm text-secondary hover:underline flex items-center gap-1">View Source <ChevronRight size={14} /></a>
                            </div>
                            {job.deliverable_url && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Deliverable Asset</span>
                                <a href={job.deliverable_url.split('\n')[0]} target="_blank" rel="noreferrer" className="text-sm text-green-400 hover:underline flex items-center gap-1">Open Link <ChevronRight size={14} /></a>
                              </div>
                            )}
                          </div>

                          {/* AI VERDICT DISPLAY */}
                          {job.status === 'CLOSED' && job.ai_verdict && (
                            <div className={`mt-2 p-5 rounded-2xl border flex flex-col gap-3 ${
                              job.ai_verdict === 'RELEASE' ? 'bg-green-500/10 border-green-500/20' : 
                              job.ai_verdict === 'REFUND' ? 'bg-red-500/10 border-red-500/20' : 
                              'bg-yellow-500/10 border-yellow-500/20'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Brain size={20} className={
                                  job.ai_verdict === 'RELEASE' ? 'text-green-400' : 
                                  job.ai_verdict === 'REFUND' ? 'text-red-400' : 
                                  'text-yellow-400'
                                } />
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm">GenLayer AI Verdict: {job.ai_verdict}</h4>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-white/20 pl-4 py-1">
                                "{job.ai_reason}"
                              </p>
                            </div>
                          )}
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
                              <div className="relative bg-background/50 backdrop-blur-sm px-6 py-4 flex flex-col items-center gap-2 group-hover:bg-transparent transition-colors">
                                <Brain size={24} className="text-white animate-pulse" />
                                <span className="font-bold text-white text-center">Run GenLayer AI Evaluator</span>
                              </div>
                            </button>
                          )}

                          {job.status === 'CLOSED' && (
                            <div className="w-full bg-surface border border-border/50 text-gray-400 px-6 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                              <Shield size={24} />
                              Contract Resolved
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
          
          {/* RICH FOOTER */}
          <footer className="mt-auto border-t border-border/50 bg-black/60 backdrop-blur-3xl pt-16 pb-8 px-10 relative z-20 shrink-0 w-full">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 text-2xl font-bold text-white">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Gavel size={18} className="text-white" />
                    </div>
                    <span className="tracking-tight text-gradient">GenLayerCourt</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                    Decentralized Escrow for High-End Services. We utilize GenLayer's non-deterministic Intelligent Contracts to automatically read GitHub, Notion, and Figma links. The AI acts as an impartial judge, ensuring deliverables match the original brief before releasing funds.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">Tech Stack</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> GenLayer StudioNet</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Python (Intelligent Contract)</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> React & Vite</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div> Tailwind CSS v4</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">Socials & Links</h4>
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-colors">
                      <Code2 size={18} />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-colors">
                      <Globe size={18} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
                <p>&copy; {new Date().getFullYear()} DeliverableCourt Team. All rights reserved.</p>
                <p className="flex items-center gap-1">Built for <span className="text-primary font-bold">GenLayer Hackathon</span></p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Futuristic Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-secondary rounded-full animate-[spin_2s_reverse_infinite]"></div>
            <div className="absolute inset-4 border-b-2 border-white rounded-full animate-[spin_3s_linear_infinite]"></div>
            <Brain size={32} className="text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">GenLayer AI Analyzing...</h2>
          <p className="text-gray-400 max-w-md text-center">The intelligent contract is reading URLs, evaluating design/code quality, and reaching consensus.</p>
        </div>
      )}
    </div>
  );
}
