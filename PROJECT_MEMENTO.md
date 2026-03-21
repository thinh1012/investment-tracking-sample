# PROJECT MEMENTO: Long-Term Context & Project DNA

This file stores the core context of the Digital HQ ecosystem to ensure AI agent alignment across sessions.

## 🧬 System DNA
- **Architecture**: Distributed (Hub-and-Satellite).
- **Primary Source of Truth**: User Override > Scout Intelligence > External APIs.
- **Visual Aesthetic**: Minimalist FinTech, Dark Mode (`slate-900`), Glassmorphism.

## 📍 Current State of Major Modules

### 1. The Vault (Portfolio Hub)
- **Accounting**: Journal-based. ROI is calculated from realized gains + paper gains. Transactions now include a `createdAt` timestamp for input tracking.
- **Security**: Rule 6.2 (Execution Boundary) is strictly enforced.
- **Sync**: Pulls from Satellite on Port 4000 via `ExternalScoutService`. Uses `ScoutAliasService` for centralized resolution of ambiguous symbols (MET, XT). Features high-fidelity persistence for dominance metrics (`BTC.D`, `USDT.D`, `USDC.D`).

### 2. Satellite Scout (Intelligence)
- **Mission Execution**: Sequential scanning using dual Puppeteer tabs.
- **API Server**: Port 4000. Provides `/aliases` endpoint for token mapping.
- **Stealth**: Human-like Jitters and Wait times enforced in `scoutEngine.js`.
- **Visibility**: Runs in a persistent terminal window (`cmd /k`).

### 3. Indicator Trends
- **Logic**: Tracks 1D and 7D % changes for global metrics (BTC.D, USDT.D, etc.).
- **UI**: Collapsible, high-density component in the Dashboard.

## 📜 Active High-Level Goals
- **Bloomberg High-Density Overhaul**: Implementing a professional, technical terminal aesthetic.
- **Cloud Sustainability**: Maintain optimized RLS policies in Supabase using subquery ID caching.
- Maintain absolute fiscal fidelity in PnL calculations.
