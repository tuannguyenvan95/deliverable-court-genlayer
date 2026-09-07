# DeliverableCourt

DeliverableCourt is an intelligent escrow dApp that resolves freelancer disputes by using GenLayer's AI validators to adjudicate submitted deliverables against the original project brief. GenLayer is required because smart contracts traditionally cannot understand or evaluate subjective off-chain data like design files or documents.

## Major Features & Milestone Upgrades (v1.1.0)
We have implemented several critical upgrades to harden contract security and improve developer & user experience:
- **Dispute Resolution Escape Hatch (`resolve_escalated_job`):** Introduces a state escape mechanism allowing clients or freelancers to mutually resolve escalated jobs (options: `SPLIT` 50/50, `CLIENT_CONCEDE` 100% to freelancer, or `FREELANCER_CONCEDE` 100% refund).
- **Dynamic Canary Token Defense:** Prevents prompt injection attacks by injecting a dynamic canary token (`hashlib.sha256(court_jobId_freelancer_attempts)`) into validator prompts. It verifies matching canary tokens inside both leader and validator outputs, automatically escalating on mismatches.
- **Multi-Source Deliverable Support:** Replaces single URL deliverables with support for comma-separated lists of URLs, enabling validators to cross-reference multiple evidence sources (e.g. GitHub repos, design specs, live urls).
- **Stricter Validator & Sandbox Principles:** Upgraded custom validator logic to compare strict semantic verdicts (`RELEASE`/`REFUND`/`PARTIAL`/`RETRY`/`ESCALATE`) while ignoring minor variations in explanation text.

### Running Regression Tests
To run the automated regression test suite locally (no network dependencies required):
```bash
python -m unittest tests/test_payout_critical_path.py -v
```
**Test Coverage Includes:**
1. `test_01_brief_fetch_exception_preserves_escrow_no_refund`: Proves network/connection failures during brief rendering lock funds under `ESCALATED` status with zero refunds emitted.
2. `test_02_brief_404_page_content_preserves_escrow`: Proves intentional HTTP 404 Brief URLs trigger escalation to protect freelancer payouts.
3. `test_03_valid_brief_but_dummy_deliverable_triggers_refund`: Confirms standard deliverable validation rules operate seamlessly when briefs are accessible.
4. `test_04_client_tampering_defense_audit`: Exhaustive audit test verifying all 4 security pillars against client brief tampering and escrow preservation.
5. `test_05_resolve_escalated_job`: Verifies dispute escape hatch resolutions (SPLIT, concessions, and unauthorized caller rejections).

## Deployed Contract (Latest Verified Build)
- Address: `0x3f221378A6Bb172165B2c06998A54D0390d2dcCC`
- Explorer Link: https://explorer-studio.genlayer.com/address/0x3f221378A6Bb172165B2c06998A54D0390d2dcCC
- Studio Contract Link: https://studio.genlayer.com/contracts/0x3f221378A6Bb172165B2c06998A54D0390d2dcCC

## Live App
- Vercel URL: https://deliverable-court-genlayer-chi.vercel.app

## Tech Stack
- React, TypeScript, Vite
- genlayer-js
- GenLayer StudioNet (Intelligent Smart Contracts)
- Python unittest (Offline Regression Suite)
