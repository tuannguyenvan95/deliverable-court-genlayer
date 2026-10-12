# Changelog

## [1.3.0] - 2026-10-12
### Added
- **Staked Appeal & High AI Tribunal**: Implemented `appeal_job(job_id, reason)` requiring a 10% stake bond and `adjudicate_appeal(job_id)` with elevated appellate prompt consensus. Supports `OVERTURN_RELEASE`, `OVERTURN_REFUND`, `UPHOLD`, and `SPLIT` verdicts. Frivolous appeals forfeit stake to the counterparty.
- **Artisan Tier Ranking & Profile System**: Added `get_user_profile(address)` calculating tiered artisan standing (`NOVICE`, `VERIFIED_PRO`, `MASTER_ARTISAN`) based on on-chain reputation, completed jobs, and dispute track record.
- **Emergency Pull-Withdrawal Safety Vault**: Implemented `withdraw_funds()` and `get_withdrawable_balance(address)` providing safe pull-payments.
- **Job Search & Status Filter Controls**: Interactive multi-tab filter (`All`, `My Escrows`, `Open`, `In Progress`, `Appealed`, `Escalated`, `Closed`) with live keyword search.
- **Expanded Test Suite to 15 Tests**: Added unit tests 10 through 15 covering appeals, tribunal consensus, tier calculations, and vault withdrawals (100% pass rate).

## [1.2.0] - 2026-09-28
### Added
- **Reputation System**: On-chain `TreeMap` tracking reputation scores for clients and freelancers. RELEASE gives +1 to both parties, REFUND gives -1 to freelancer. Scores queryable via `get_reputation()`.
- **Job Cancellation**: `cancel_job()` allows clients to cancel OPEN jobs (no freelancer assigned) and reclaim escrowed funds safely.
- **Deadline Enforcement**: `claim_deadline_refund()` enables clients to reclaim funds when freelancers miss the configurable deadline (`deadline_hours` param in `create_job`). Missed deadlines also penalize freelancer reputation.
- **Timestamp Tracking**: Jobs now store `created_at` and `deadline` timestamps using `gl.block.timestamp`.
- **9 regression tests** covering all new features (test_07, test_08, test_09).

### Fixed
- **2-of-2 Mutual SPLIT Approval** (steward feedback fix from v1.1.0 resubmission).

## [1.1.0] - 2026-08-30
### Added
- **Documentation Overhaul v1**: Added `ARCHITECTURE.md` and `SECURITY.md` for better developer onboarding and audit transparency.
- Established baseline for Milestone tracking.

## [1.0.1] - 2026-08-04
### Fixed
- **Payout-Critical Security Path**: Defended against client brief tampering. Changed fallback verdict to `ESCALATE` instead of `REFUND` on brief fetch failures.
- Added 4-pillar regression test suite for brief fetch exceptions and 404s.

## [1.0.0] - 2026-07-30
### Added
- Initial deployment to GenLayer StudioNet.
- Implemented `DeliverableCourt` contract with `run_nondet` AI adjudication.
- Basic React frontend connected via `genlayer-js`.
