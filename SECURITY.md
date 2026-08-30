# Security & Threat Model

This document outlines the security considerations and implemented mitigations in DeliverableCourt.

## Threat Model

### 1. Client Brief Tampering (The "Bait and Switch")
**Threat:** A malicious client deletes or modifies their brief URL just before the AI evaluates the freelancer's work, forcing a "brief fetch failure" to trick the AI into refunding the client.
**Mitigation:** The smart contract implements a rigid "Payout-Critical Path" defense. If `gl.nondet.web.render` fails to fetch the brief, the AI's fallback mechanism forces an `ESCALATE` verdict. The escrow remains locked (`status = "ESCALATED"`), and zero funds are refunded to the client.

### 2. Validator Non-Determinism (The "Schizophrenic AI")
**Threat:** AI validators might output slightly different reasoning text, causing consensus failure if checked strictly.
**Mitigation:** We use `gl.vm.run_nondet(leader_fn, validator_fn)`. The custom `validator_fn` explicitly compares only the `verdict` field (the actual meaning) while ignoring the `reason` string variations.

### 3. State Manipulation during Adjudication
**Threat:** Reentrancy or state changes occurring during the non-deterministic block.
**Mitigation:** Intelligent Contracts sandbox non-deterministic blocks. The code reads required state (`brief_url`, `deliverable_url`) *before* entering the nondet closure, ensuring state isolation.

### 4. Zero-Value and Double Claims
**Threat:** Malicious users might try to submit empty jobs or trigger payouts on already closed jobs.
**Mitigation:** Pre-flight assertions in the deterministic code prevent `adjudicate` from running if `job.status != "IN_PROGRESS"`.

## Audit Checklist
- [x] Client Tampering Escrow Preservation
- [x] Sandboxed Non-Deterministic Execution
- [x] Stricter Validator Logic (`validator_fn` compares verdicts)
- [x] BigInt for all financial storage
- [x] Address to String normalization for TreeMap keys
