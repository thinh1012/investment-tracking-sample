# Development Changelog

All notable changes to this project will be documented in this file.

## [2025-12-19] - Reliability, Scalability & Visual Excellence

### Added
- **`PROJECT_RULES.md`**: Established rigorous ground rules for AI interaction, requiring implementation plans and explicit approval for all major changes.
- **Scalability Refactor (`EarningsHistory`)**: Re-architected the complex earnings module into a modular system. Extracted core business logic into a standalone, unit-tested utility (`lpEarningsCalculator.ts`).
- **LP Yield Tracker Sorting**: Added multi-column sorting (Pool Name, Principal, Realized Fees, Payback %) to the analytics dashboard.
- **Log Claim Automation**: Enhanced the "Log Claim" workflow with auto-selection of the source LP and smart reward token inference (HYPE, USDC).
- **Earn Tab Refinement**: Standardized interest logging UI with descriptive labels and smart field toggling to reduce visual clutter during claims.
- **Custom Branding**: Replaced default Vite assets with a premium emerald/slate clipboard SVG logo throughout the application.
- **Historical Price Tracking**: Implemented a background sync engine to pull and store 30-day daily open/close (OHLC) data for all portfolio tokens. Added a new `HistoricalPerformance` UI component to visualize daily volatility.
- **Cloud-First Data Safety**: Removed redundant local backup notifications as the automated Cloud Vault now handles comprehensive data preservation (including historical prices).
- **Automated Verification**: Introduced Vitest suites for mission-critical LP calculation logic to prevent regressions.

### Fixed
- **Claim State Sync**: Resolved an issue where the multi-select UI didn't pre-populate from default form values.
- **LP Selection Filtering**: Broadened detection logic to include pools with dashes, spaces, and "POOL/SWAP" keywords.
- **Reward Config Persistence**: Fixed a bug where reward token configurations were not saving to the correct asset during interest logging.

---

## [2025-12-18] - LP Fee Tracker & Analytics Refactor

### Added
- **LP Fee Claim Tracker**: New analytics module to track cash principal recovery vs. realized yields.
- **Payback Progress Bars**: Visual indicator of capital risk-free status.
- **Analytics Tab Switcher**: Interactive toggle between Earnings History and LP Yield Tracker.
- **Log Claim Shortcuts**: Added quick-action buttons to LP rows to initiate interest logging.

---

## [Previous Milestones]
- **Cloud Sync Automation**: Real-time Supabase integration.
- **Bitcoin RSI Analog Chart**: Technical analysis integration.
- **Architecture Mapping**: Core data flow documentation.
