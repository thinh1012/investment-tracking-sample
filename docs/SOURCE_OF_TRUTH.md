# 📜 Source of Truth: Alpha Vault Pro

This document serves as the absolute technical anchor for the Alpha Vault Pro (Investment Tracking) project. It defines the core architecture, data patterns, and non-negotiable standards.

## 1. Project Identity
- **Name**: Alpha Vault Pro
- **Status**: Stable / Evolution
- **Primary Goal**: High-efficiency, security-first investment tracking with real-time DeFi analytics.

## 2. Technical Core (The "How")
- **Frontend**: React 19+ (Vite)
- **Typing**: TypeScript (Strict financial types)
- **Styling**: Tailwind CSS 4 (Premium Glassmorphism Aesthetic)
- **Persistence**: IndexedDB (Primary) + LocalStorage (Display Preferences)
- **Security**: Local-first. AES-256 encrypted Cloud Sync (Supabase). No sensitive logging.

## 3. Data Architecture: The Golden Triangle
All portfolio state is derived through a pure, unidirectional flow:
1.  **Transactions (Ground Truth)**: Raw BUY, SELL, INTEREST, DEPOSIT, WITHDRAWAL logs.
2.  **Prices (Reality Check)**: Real-time API feeds + Manual Overrides.
3.  **Calculator (Pure Function)**: `src/domain/portfolioCalculator.ts`. Computes PnL, Cost Basis, and LP Delta in real-time without mutating raw data.

## 4. Service Map (Refactored)
As of December 2025, the database services are modularized under `src/services/database/`:
- `transactionService.ts`: Core ledger operations.
- `backupService.ts`: JSON Export/Import & Storage Snapshots.
- `otherServices.ts`: Settings, Watchlist, Market Picks, and Price Overrides.

## 5. Development Principles
- **Segregation of Duties**: Operations managed by [ARCHITECT], [BUILDER], [CRITIC], and [SECURITY_OFFICER].
- **[BUILDER]**: Executes implementation plans with speed and precision.
- **[CRITIC]**: Tests functionality and UI aesthetics against "Premium" standards.
- **[SECURITY_OFFICER]**: Audits code for data leakage and ensures "Zero-Knowledge" sync.

### 6. Communication Flower (The Protocol)
We follow a strict intake/output cycle:
`INTAKE ([USER]) → DESIGN ([ARCHITECT]) → BUILD ([BUILDER]) → AUDIT ([SECURITY_OFFICER]) → VERIFY ([CRITIC]) → DOCUMENT ([ARCHITECT]) → CLOSE OUT ([USER])`.
- **Vibe Efficiency**: Keep files small (~100-200 lines). Extract UI components aggressively.

---
*Maintained by the ARCHITECT.*
