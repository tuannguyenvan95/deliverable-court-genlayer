import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Gavel, Wallet, Briefcase, AlertTriangle, LayoutDashboard, Settings, Brain, Shield, Globe, Code2 } from 'lucide-react';
import './index.css';

const CONTRACT_ADDRESS = "0x41A52a8C1130E0e3f2A6A2e3EF2512c27776aC76";

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
      
      const newClient = createClient({
        chain: studionet,
        provider: (window as any).ethereum,
        account: accounts[0]
      } as any);
      setClient(newClient);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    const readOnlyClient = createClient({
      chain: studionet,
    });
    setClient(readOnlyClient);
  };

  const fillDemoCreateJob = () => {
    const demos = [
      { t: "High-converting Web3 Landing Page", d: "Create a sleek landing page matching the Figma design. Must be fully responsive and built with React. Ensure all 4 sections are pixel-perfect.", b: "https://www.notion.so/Web3-Landing-Page-Brief", a: "5000000000000000000" },
      { t: "Smart Contract Audit & Fixes", d: "Audit the attached ERC20 token contract. Fix any reentrancy vulnerabilities and optimize gas usage for the mint function.", b: "https://github.com/demo/erc20-audit-brief", a: "12000000000000000000" },
      { t: "DeFi Dashboard UI Integration", d: "Integrate the new Web3 hooks into the existing React dashboard. Ensure wallet connection works with WalletConnect and MetaMask.", b: "https://www.figma.com/file/demo-defi-dashboard", a: "8000000000000000000" }
    ];
    const r = demos[Math.floor(Math.random() * demos.length)];
    setTitle(r.t); setDesc(r.d); setBriefUrl(r.b); setAmount(r.a);
  };

  const fillDemoSubmit = () => {
    const demos = [
      { u: "https://github.com/demo/web3-landing-page", n: "Completed all 4 sections exactly as in the Figma. Fully responsive on mobile. Deployed link is in the README." },
      { u: "https://github.com/demo/fixed-erc20-contract", n: "Found 2 reentrancy vectors and fixed them. Gas usage reduced by 15%. Tests are passing." },
      { u: "https://github.com/demo/defi-dashboard-integration", n: "Integrated all Web3 hooks. Wallet connection is smooth. Tested with MetaMask and TrustWallet." }
    ];
    const r = demos[Math.floor(Math.random() * demos.length)];
    setDeliverableUrl(r.u); setNotes(r.n);
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
      setJobs(prev => {
        const pending = prev.filter(j => j.id.startsWith("PENDING-") && (Date.now() - parseInt(j.id.split('-')[1])) < 15000);
        return [...pending, ...jobsArray.reverse()];
      });
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
    if (!CONTRACT_ADDRESS) return setErrorMsg('CRITICAL: CONTRACT_ADDRESS is undefined in the code. Please clear browser cache.');
    if (account === "undefined") return setErrorMsg('CRITICAL: Account is evaluating to the string "undefined". Re-connect wallet.');
    setLoading(true);
    setErrorMsg(null);
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'create_job',
        args: [title, desc, briefUrl],
        value: BigInt(amount),
        account: client.account || { address: account, type: "json-rpc" },
      });
      const optimisticJob = {
        id: "PENDING-" + Date.now(),
        client: account,
        freelancer: "0x0000000000000000000000000000000000000000",
        title: title,
        description: desc,
        brief_url: briefUrl,
        deliverable_url: "",
        amount: amount,
        status: "OPEN",
        freelancer_notes: "",
        ai_verdict: "",
        ai_reason: "",
        created_at: Math.floor(Date.now() / 1000)
      };
      setJobs(prev => [optimisticJob, ...prev]);
      
      setTitle(''); setDesc(''); setBriefUrl(''); setAmount('');
      setActiveTab('jobs');
      setTimeout(fetchJobs, 2000);
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
        account: client.account || { address: account, type: "json-rpc" },
      });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'IN_PROGRESS', freelancer: account } : j));
      setTimeout(fetchJobs, 2000);
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
        account: client.account || { address: account, type: "json-rpc" },
      });
      setJobs(prev => prev.map(j => j.id === activeJobId ? { ...j, deliverable_url: deliverableUrl, freelancer_notes: notes } : j));
      setActiveJobId(null);
      setDeliverableUrl('');
      setNotes('');
      setActiveTab('jobs');
      setTimeout(fetchJobs, 2000);
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
        account: client.account || { address: account, type: "json-rpc" },
      });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'EVALUATING' } : j));
      setTimeout(fetchJobs, 4000);
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
    <div className="flex min-h-screen relative font-sans text-gray-200 selection:bg-primary/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 sticky top-0 h-screen shrink-0 z-30">
        <div className="flex items-center gap-3 font-bold text-white mb-10 mt-2">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center">
            <Gavel size={18} />
          </div>
          <span className="tracking-tight text-lg">GenLayerCourt</span>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Briefcase size={16} /> Escrows
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Settings size={16} /> Settings
          </button>
        </nav>

        <div className="mt-auto">
          {account ? (
            <div className="glass-card rounded-lg p-3 flex items-center justify-between gap-3 group relative cursor-pointer overflow-hidden" onClick={disconnectWallet}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Wallet size={14} className="text-gray-300" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-gray-500 font-medium uppercase">Connected</span>
                  <span className="text-xs font-mono text-gray-200 truncate">{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                Disconnect
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Wallet size={16} /> Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 w-full overflow-hidden">
        
        <div className="flex-1 overflow-y-auto w-full flex flex-col scroll-smooth">
          
          {/* Error Notification Float */}
          {errorMsg && (
            <div className="fixed top-6 right-6 z-50 animate-[float_3s_ease-in-out_infinite]">
              <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-400 px-6 py-4 rounded-xl flex items-start gap-3 max-w-sm shadow-2xl">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-red-400 text-sm">Error</span>
                  <span className="text-xs text-red-300/80">{errorMsg}</span>
                </div>
              </div>
            </div>
          )}

          <header className="px-10 py-6 flex justify-between items-center sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/5 z-40">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'jobs' ? 'Escrow Contracts' : 'Protocol Configurations'}
            </h1>
            
            <div className="flex items-center gap-3 hidden md:flex">
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-medium text-gray-400">
                <Brain size={14} className="text-primary" />
                AI Evaluator Active
              </div>
              <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-xs font-medium text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                StudioNet
              </div>
            </div>
          </header>

          <div className="p-10 max-w-6xl w-full mx-auto flex-1 pb-16">
            
            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-500 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-2">Protocol Core Settings</h2>
                <p className="text-gray-400 mb-8 text-sm max-w-2xl">Manage your connection to the GenLayer Intelligent Network. The protocol relies on LLM-driven consensus to adjudicate subjective off-chain data securely.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Smart Contract Address</h3>
                    <code className="block text-sm text-gray-300 font-mono bg-white/5 border border-white/5 px-4 py-3 rounded-lg break-all">
                      {CONTRACT_ADDRESS}
                    </code>
                  </div>
                  
                  <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">GenLayer RPC Endpoint</h3>
                    <code className="block text-sm text-gray-300 font-mono bg-white/5 border border-white/5 px-4 py-3 rounded-lg break-all">
                      https://studio.genlayer.com/rpc
                    </code>
                  </div>

                  <div className="glass-panel rounded-xl p-6 md:col-span-2 flex gap-6 items-center">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">GenLayer AI Validator (LLM)</h3>
                      <p className="text-gray-400 text-sm">The protocol uses GenLayer's built-in non-deterministic LLM consensus to evaluate design (Figma), code (GitHub), and docs (Notion) directly from URLs without human intervention.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-500">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Escrows</h3>
                    <div className="text-3xl font-light text-white">{totalJobs}</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">In Progress</h3>
                    <div className="text-3xl font-light text-white">{activeJobs}</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-white/5">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1">Adjudicated</h3>
                    <div className="text-3xl font-light text-white">{closedJobs}</div>
                  </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Create Job Form */}
                  <div className="glass-panel rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        Deploy New Escrow
                      </h2>
                      <button onClick={fillDemoCreateJob} type="button" className="text-[10px] bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded uppercase font-bold transition-colors">
                        Auto-fill Demo Data
                      </button>
                    </div>
                    
                    <form onSubmit={createJob} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">Project Title</label>
                        <input required className="w-full bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. High-end UI Design (Figma)" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">Scope of Work</label>
                        <textarea required className="w-full bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors min-h-[80px] resize-y" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detailed requirements for the AI to judge against..."></textarea>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">Original Brief (Public URL)</label>
                        <input required type="url" className="w-full bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors" value={briefUrl} onChange={e => setBriefUrl(e.target.value)} placeholder="https://docs.google.com/..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400">Escrow Amount (Wei)</label>
                        <input required type="number" className="w-full bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000000000000000" />
                      </div>
                      
                      <button disabled={loading || !account} type="submit" className="w-full mt-4 bg-white text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-white/20 disabled:text-gray-400">
                        Create & Fund
                      </button>
                    </form>
                  </div>

                  {/* Right Column / Submit Deliverable Context */}
                  <div className="flex flex-col h-full">
                    {activeJobId ? (
                      <div className="glass-panel rounded-xl p-8 border-primary/20 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            Submit Final Deliverable
                          </h2>
                          <button onClick={fillDemoSubmit} type="button" className="text-[10px] bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded uppercase font-bold transition-colors">
                            Auto-fill Demo Data
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">
                          Targeting Job ID: <span className="font-mono text-gray-300 ml-1">{activeJobId}</span>
                        </p>
                        
                        <form onSubmit={submitDeliverable} className="space-y-4 flex-1 flex flex-col">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400">Deliverable Asset URL</label>
                            <input required type="url" className="w-full bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors" value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://www.figma.com/..." />
                          </div>
                          <div className="space-y-1.5 flex-1 flex flex-col">
                            <label className="text-xs font-medium text-gray-400">Pitch for AI Evaluator</label>
                            <textarea className="w-full flex-1 bg-black/50 border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-white/30 transition-colors min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain how your work meets the original brief..."></textarea>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="flex-2 bg-white text-black px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex-grow">
                              Submit
                            </button>
                            <button type="button" onClick={() => setActiveJobId(null)} className="flex-1 bg-transparent border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/5 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="glass-panel rounded-xl flex flex-col items-center justify-center flex-1 border-dashed border-white/10 text-gray-500 text-center px-8 min-h-[300px]">
                        <Brain size={24} className="text-gray-600 mb-4" />
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Awaiting Context</h3>
                        <p className="text-xs max-w-xs leading-relaxed">Select an In-Progress job from the Escrows tab to submit your deliverable for evaluation.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Stepper - Moved below the form */}
                <div className="mt-8 pt-8 border-t border-[#222]">
                  <h2 className="text-sm font-semibold text-gray-300 mb-8 font-mono tracking-wider uppercase text-center flex items-center justify-center gap-2">
                    <Brain size={16} className="text-[#a855f7]" /> GenLayer Intelligent Workflow
                  </h2>
                  <div className="flex flex-col md:flex-row items-start justify-between relative max-w-4xl mx-auto">
                    <div className="hidden md:block absolute left-0 top-4 w-full h-px bg-gradient-to-r from-[#222] via-[#444] to-[#222] z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">1</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Create</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Client locks bounty in smart contract with brief URL.</p>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">2</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Build</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Freelancer accepts and submits final GitHub/Figma URL.</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center mb-6 md:mb-0 bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(177,85,255,0.15)]">
                        <Brain size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">AI Evaluates</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">GenLayer LLM reads both URLs & evaluates quality.</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 w-full md:w-1/4 text-center bg-[#0a0a0a]">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs text-gray-400 font-mono shadow-[0_0_15px_rgba(255,255,255,0.05)]">4</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Release</h4>
                        <p className="text-[11px] text-gray-500 max-w-[160px] mx-auto">Funds released, partially refunded, or fully refunded.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* JOBS TAB */}
            {activeTab === 'jobs' && (
              <div className="animate-in fade-in duration-500 space-y-6">
                {jobs.length === 0 ? (
                  <div className="glass-panel rounded-xl py-20 text-center flex flex-col items-center border-dashed border-white/10">
                     <Briefcase size={32} className="mb-4 text-gray-600" />
                     <h3 className="text-lg font-medium text-gray-400 mb-1">No Escrows Found</h3>
                     <p className="text-sm text-gray-600">Create a job to get started.</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="glass-panel rounded-xl p-6 hover:border-white/20 transition-colors">
                      <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* Job Info */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-col mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                                job.status === 'OPEN' ? 'bg-green-500/10 text-green-400' : 
                                job.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-500' : 
                                job.status === 'EVALUATING' ? 'bg-purple-500/10 text-purple-400 animate-pulse' :
                                'bg-white/5 text-gray-400'
                              }`}>
                                {job.status}
                              </span>
                            </div>

                            {/* Minimal Progress Bar */}
                            <div className="flex items-center gap-1.5 mb-1 w-full max-w-sm">
                              <div className={`h-1 flex-1 rounded-full ${job.status !== 'OPEN' ? 'bg-white/80' : 'bg-white/80'}`}></div>
                              <div className={`h-1 flex-1 rounded-full ${job.status === 'IN_PROGRESS' || job.status === 'CLOSED' ? 'bg-white/80' : 'bg-white/10'}`}></div>
                              <div className={`h-1 flex-1 rounded-full ${job.status === 'CLOSED' ? 'bg-white/80' : 'bg-white/10'}`}></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-500 uppercase font-semibold max-w-sm">
                              <span>Funded</span>
                              <span className="text-center pl-6">Building</span>
                              <span className="text-right">Closed</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            {job.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 rounded-lg p-4 border border-white/5 mb-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-gray-500 uppercase font-semibold">Client</span>
                              <span className="font-mono text-xs text-gray-300">{job.client.slice(0,6)}...{job.client.slice(-4)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-gray-500 uppercase font-semibold">Amount</span>
                              <span className="font-mono text-xs text-white">{job.amount} WEI</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-gray-500 uppercase font-semibold">Brief</span>
                              <a href={job.brief_url} target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-white hover:underline truncate">Link ↗</a>
                            </div>
                            {job.deliverable_url && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-gray-500 uppercase font-semibold">Deliverable</span>
                                <a href={job.deliverable_url.split('\n')[0]} target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-white hover:underline truncate">Link ↗</a>
                              </div>
                            )}
                          </div>

                          {/* AI VERDICT DISPLAY */}
                          {job.ai_verdict && (
                            <div className={`p-4 rounded-lg border bg-black/40 ${
                              job.ai_verdict === 'RELEASE' ? 'border-green-500/20 text-green-100' : 
                              job.ai_verdict === 'REFUND' ? 'border-red-500/20 text-red-100' : 
                              'border-yellow-500/20 text-yellow-100'
                            }`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <Brain size={14} className={
                                  job.ai_verdict === 'RELEASE' ? 'text-green-400' : 
                                  job.ai_verdict === 'REFUND' ? 'text-red-400' : 
                                  'text-yellow-400'
                                } />
                                <h4 className="font-semibold text-xs uppercase tracking-wider">AI Verdict: {job.ai_verdict}</h4>
                              </div>
                              <p className="text-xs leading-relaxed opacity-80 border-l border-white/20 pl-3">
                                "{job.ai_reason}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Panel */}
                        <div className="w-full lg:w-48 lg:border-l border-white/5 lg:pl-6 flex flex-col justify-center gap-3">
                          {job.status === 'OPEN' && (
                            <button onClick={() => acceptJob(job.id)} disabled={loading || !account} className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-gray-500 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                              Accept Job
                            </button>
                          )}
                          
                          {job.status === 'IN_PROGRESS' && !job.deliverable_url && (
                            <button onClick={() => { setActiveJobId(job.id); setActiveTab('dashboard'); }} disabled={loading} className="w-full bg-transparent border border-white/20 text-white hover:bg-white/5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                              Submit Work
                            </button>
                          )}
                          
                          {job.status === 'IN_PROGRESS' && job.deliverable_url && (
                            <button onClick={() => adjudicate(job.id)} disabled={loading} className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                              <Brain size={14} /> Evaluate
                            </button>
                          )}

                          {job.status === 'EVALUATING' && (
                            <div className="w-full border border-primary/20 bg-primary/5 text-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              AI Running...
                            </div>
                          )}

                          {job.status === 'CLOSED' && (
                            <div className="w-full border border-dashed border-white/10 text-gray-500 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5">
                              <Shield size={14} /> Resolved
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
          <footer className="mt-auto border-t border-white/5 bg-black/80 pt-12 pb-6 px-10 shrink-0 w-full">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                      <Gavel size={14} className="text-black" />
                    </div>
                    <span>GenLayerCourt</span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-sm">
                    Decentralized Escrow for High-End Services. We utilize GenLayer's Intelligent Contracts to automatically evaluate design (Figma) and code (GitHub). The AI acts as an impartial judge, ensuring deliverables match the original brief.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Tech Stack</h4>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li>• GenLayer StudioNet</li>
                    <li>• Python (Smart Contract)</li>
                    <li>• React & Vite</li>
                    <li>• Tailwind v4 (CSS)</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Connect</h4>
                  <div className="flex gap-3">
                    <a href="#" className="text-gray-500 hover:text-white transition-colors">
                      <Code2 size={16} />
                    </a>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors">
                      <Globe size={16} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600">
                <p>&copy; {new Date().getFullYear()} DeliverableCourt Team.</p>
                <p>Built for the <span className="text-gray-400 font-medium">GenLayer Hackathon</span></p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
          <Brain size={32} className="text-white animate-pulse mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Processing via GenLayer AI</h2>
          <p className="text-xs text-gray-500">Awaiting consensus from the decentralized network...</p>
        </div>
      )}
    </div>
  );
}
