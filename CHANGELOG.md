# Changelog

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
