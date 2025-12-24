# Project Skills & Knowledge Reference

This document outlines the core competencies required to develop, maintain, and evolve the **Investment Tracking** system. It serves as a guide for future contributors and AI versions.

## 1. Technical Stack (The "How")

### Frontend Engineering
- **React (v19+)**: Mastery of functional components, hooks (`useMemo`, `useCallback`, `useEffect`), and custom hook patterns for state extraction.
- **TypeScript**: Strict typing for financial data structures to prevent precision errors.
- **Vite**: Understanding the build pipeline, environment variables, and HMR (Hot Module Replacement).
- **TailwindCSS (v4)**: Modern styling, custom color palettes, and responsive design (mobile/desktop).
- **Recharts**: Data visualization for portfolio history and asset distribution.
- **Lucide React**: Iconography and UI micro-interactions.

### Systems & Architecture
- **IndexedDB (idb)**: Managing local persistence for transaction history and manual overrides.
- **Electron**: Packaging the web application as a cross-platform desktop app.
- **API Integration**: Interaction with external REST APIs (CoinGecko, Hyperliquid, DexScreener) including rate limiting handling and fallback strategies.
- **Domain-Driven Design**: Keeping business logic (PnL calculations, LP range checks) separated from UI components (located in `src/domain`).

## 2. Domain Expertise (The "What")

### DeFi & Crypto Mechanics
- **Liquidity Pools (LP)**: Understanding AMM (Automated Market Maker) mechanics, range-bound liquidity (Uniswap V3 style), and impermanent loss.
- **Yield Tracking**: Calculating earnings from farming, staking, and interest-bearing assets.
- **Cost Basis Calculation**: Mastery of Average Buy Price logic, including fresh capital vs. transfer-from-holdings logic.
- **Financial Metrics**: Calculating Unrealized PnL, PnL Percentage, and Portfolio Dominance.

### Data Integrity
- **Precision Management**: Handling floating point math for crypto quantities.
- **Backup & Sync**: Logic for manual/auto backups (JSON exports) and potential cloud syncing (Supabase/Google Drive).

## 3. Tooling & Workflow
- **PowerShell/Shell Scripting**: Bypassing execution policies on Windows for dev workflows (e.g., using `.cmd` fallbacks).
- **Git**: Branching, versioning, and state management.
- **Verification**: Writing Vitest units for core calculation logic.

## 4. AI Interaction Patterns
- **Context Management**: Providing clear instructions on aesthetics (glassmorphism, vibrant UI).
- **Modular Refactoring**: Breaking down large components (like `Settings.tsx`) into logical sub-units for maintainability.
- **Debugging**: Systematically tracing logic from the UI -> Hooks -> Domain Logic -> Database.

## 5. Developing Skills (Roadmap)
As the project evolves, the following areas will become critical:

### On-Chain Integration (Web3)
- **Ethers.js / Viem**: Transitioning from centralized APIs (CoinGecko) to direct blockchain data fetching for more accurate LP balances and reward claims.
- **Multicall Logic**: Efficiently fetching data for dozens of assets in a single network request.

### Advanced Data Management
- **SQL / Relational Databases**: Moving beyond IndexedDB for more complex queries and multi-device synchronization (e.g., Supabase or PostgreSQL).
- **Service Workers / PWA**: Improving the "Offline-First" experience and background price monitoring.


### High-Density Data Presentation
- **Advanced Tables**: Crafting highly efficient, sortable, and filterable data grids that prioritize raw number visibility and information density over visual abstractions (charts).
- **Data Export & Transformation**: Expertise in building robust raw data export tools (CSV/JSON) for external analysis.
- **Precision Raw Calculations**: Ensuring 100% accuracy in cumulative totals and multi-currency conversions for dense auditing.
