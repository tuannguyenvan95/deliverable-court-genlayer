# Changelog

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
