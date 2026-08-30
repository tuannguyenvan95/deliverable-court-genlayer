# DeliverableCourt Architecture

DeliverableCourt is built on GenLayer's Intelligent Smart Contract platform, providing an AI-driven escrow service for subjective deliverables.

## Core Components

1. **Intelligent Smart Contract (`contracts/deliverable_court.py`)**
   - Written in Python for GenVM.
   - Manages state (Jobs, Balances).
   - Uses `gl.vm.run_nondet` for subjective AI adjudication.

2. **Frontend dApp (`frontend/src/App.tsx`)**
   - React + Vite + TailwindCSS.
   - Uses `genlayer-js` to communicate with the GenLayer StudioNet.
   - Connects to user wallets for signing transactions.

## Flow Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Freelancer
    participant SC as Smart Contract
    participant AI as GenLayer AI Validators

    C->>SC: create_job(amount, brief_url)
    SC-->>C: job_id
    F->>SC: accept_job(job_id)
    F->>SC: submit_deliverable(job_id, deliverable_url)
    
    Note over SC, AI: Adjudication Phase
    SC->>AI: Trigger gl.vm.run_nondet
    AI->>AI: Fetch brief_url & deliverable_url
    AI->>AI: Evaluate deliverable against brief
    AI-->>SC: Return Verdict (RELEASE / REFUND / ESCALATE)
    
    alt Verdict == RELEASE
        SC->>F: Transfer Escrow to Freelancer
    else Verdict == REFUND
        SC->>C: Refund Escrow to Client
    else Verdict == ESCALATE (e.g. brief tampering)
        SC->>SC: Lock funds, manual review needed
    end
```

## Storage Design
- `jobs: TreeMap[str, Job]`
- `Job` struct uses `bigint` for financial values to prevent overflow constraints and ensures type safety per GenLayer standards.
