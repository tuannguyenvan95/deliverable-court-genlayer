import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import fs from 'fs';

async function deploy() {
  const client = createClient({ chain: studionet });
  const account = createAccount();
  console.log("Deploying with generated test account:", account.address);
  
  const code = fs.readFileSync('../contracts/deliverable_court.py', 'utf-8');
  try {
    const txHash = await client.deployContract({
      account: account,
      code: code,
      args: [],
    });
    console.log("Deploy transaction submitted! Hash:", txHash);
    
    console.log("Waiting for deployment receipt...");
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: "accepted",
      fullTransaction: false
    });
    console.log("Deployment Receipt:", JSON.stringify(receipt, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2));
    
    // Check execution result and new contract address
    const tx = await client.getTransaction({ hash: txHash });
    console.log("TX details after deploy:", JSON.stringify(tx, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2));
  } catch (e) {
    console.error("Deploy failed:", e.message || e);
  }
}
deploy();
