import json

with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

fillDemoCreateJob = """  const fillDemoCreateJob = () => {
    const demos = [
      { t: "Smart Contract Audit & Fixes", d: "Audit the attached ERC20 token contract. Fix any reentrancy vulnerabilities and optimize gas usage for the mint function.", b: "https://deliverable-court-genlayer.vercel.app/demo-brief-1.txt", a: "12" }
    ];
    const r = demos[Math.floor(Math.random() * demos.length)];
    setTitle(r.t); setDesc(r.d); setBriefUrl(r.b); setAmount(r.a);
  };"""

fillDemoSubmit = """  const fillDemoSubmit = () => {
    const demos = [
      { u: "https://deliverable-court-genlayer.vercel.app/demo-deliverable-1.txt", n: "Found 2 reentrancy vectors and fixed them. Gas usage reduced by 15%. Tests are passing." }
    ];
    const r = demos[Math.floor(Math.random() * demos.length)];
    setDeliverableUrl(r.u); setNotes(r.n);
  };"""

new_fillDemoCreateJob = """  const fillDemoCreateJob = () => {
    const demos = [
      { t: "Smart Contract Audit & Fixes", d: "Audit the attached ERC20 token contract. Fix any reentrancy vulnerabilities and optimize gas usage for the mint function.", b: "https://deliverable-court-genlayer.vercel.app/demo-brief-1.txt", a: "12" },
      { t: "High-converting Web3 Landing Page", d: "Create a sleek landing page matching the Figma design. Must be fully responsive and built with React. Ensure all 4 sections are pixel-perfect.", b: "https://deliverable-court-genlayer.vercel.app/demo-brief-2.txt", a: "5" },
      { t: "DeFi Dashboard UI Integration", d: "Integrate the new Web3 hooks into the existing React dashboard. Ensure wallet connection works with WalletConnect and MetaMask.", b: "https://deliverable-court-genlayer.vercel.app/demo-brief-3.txt", a: "8" }
    ];
    const r = demos[Math.floor(Math.random() * demos.length)];
    setTitle(r.t); setDesc(r.d); setBriefUrl(r.b); setAmount(r.a);
  };"""

new_fillDemoSubmit = """  const fillDemoSubmit = () => {
    const activeJob = jobs.find(j => j.id === activeJobId);
    let u = "https://deliverable-court-genlayer.vercel.app/demo-deliverable-1.txt";
    let n = "Found 2 reentrancy vectors and fixed them. Gas usage reduced by 15%. Tests are passing.";
    
    if (activeJob) {
      if (activeJob.title === "High-converting Web3 Landing Page") {
        u = "https://deliverable-court-genlayer.vercel.app/demo-deliverable-2.txt";
        n = "Completed all 4 sections exactly as in the Figma. Built with React and TailwindCSS. Fully responsive on mobile. Deployed to Vercel. All requirements met perfectly.";
      } else if (activeJob.title === "DeFi Dashboard UI Integration") {
        u = "https://deliverable-court-genlayer.vercel.app/demo-deliverable-3.txt";
        n = "Integrated all Web3 hooks. Wallet connection is smooth. Tested thoroughly with MetaMask and WalletConnect. No errors in console. Meets all requirements.";
      }
    }
    setDeliverableUrl(u); setNotes(n);
  };"""

if fillDemoCreateJob in content and fillDemoSubmit in content:
    content = content.replace(fillDemoCreateJob, new_fillDemoCreateJob)
    content = content.replace(fillDemoSubmit, new_fillDemoSubmit)
    
    with open('c:\\Users\\Admin\\Documents\\genlayer\\DeliverableCourt\\frontend\\src\\App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("NOT FOUND")
