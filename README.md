# DeliverableCourt

DeliverableCourt is an intelligent escrow dApp that resolves freelancer disputes by using GenLayer's AI validators to adjudicate submitted deliverables against the original project brief. GenLayer is required because smart contracts traditionally cannot understand or evaluate subjective off-chain data like design files or documents.

## Security Audit & Payout-Critical Path Verification
Following security review feedback, DeliverableCourt enforces strict protection against client brief tampering and network fetch failures during automated AI adjudication:
- **Brief-Fetch Failure Protection:** If fetching a client's Brief URL fails (due to network timeout, server offline, DNS failure, or HTTP 404), the smart contract immediately overrides default behavior to output verdict **`ESCALATE`** (status: `ESCALATED`). This locks and preserves the escrowed balance inside the contract instead of triggering an automated refund to the client, effectively preventing malicious clients from breaking their brief links after freelancer deliverable submission to steal back funds.
- **Automated Regression Testing:** We provide a comprehensive, self-contained regression test suite verifying this payout-critical path.

### Running Regression Tests
To run the automated regression test suite locally (no network dependencies required):
```bash
python -m unittest tests/test_payout_critical_path.py -v
```
**Test Coverage Includes:**
1. `test_01_brief_fetch_exception_preserves_escrow_no_refund`: Proves network/connection failures during brief rendering lock funds under `ESCALATED` status with zero refunds emitted.
2. `test_02_brief_404_page_content_preserves_escrow`: Proves intentional HTTP 404 Brief URLs trigger escalation to protect freelancer payouts.
3. `test_03_valid_brief_but_dummy_deliverable_triggers_refund`: Confirms standard deliverable validation rules operate seamlessly when briefs are accessible.

## Deployed Contract
- Address: `0x160B79DA501ADB54c5362f3293563c0F762Fe952`
- Explorer Link: https://explorer-studio.genlayer.com/address/0x160B79DA501ADB54c5362f3293563c0F762Fe952
- Studio Contract Link: https://studio.genlayer.com/contracts/0x160B79DA501ADB54c5362f3293563c0F762Fe952

## Live App
- Vercel URL: https://deliverable-court-genlayer.vercel.app

## Tech Stack
- React, TypeScript, Vite
- genlayer-js
- GenLayer StudioNet (Intelligent Smart Contracts)
- Python unittest (Offline Regression Suite)
