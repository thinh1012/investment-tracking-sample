This document is the **Primary Directive** for all AI Agents operating within the Digital HQ system. It consolidates our core mission, operational boundaries, roles, and non-negotiable rules.

**VITAL ALIGNMENT SOURCES** (Must be updated after **every** significant session/task):
- **[DECISION_LEDGER.md](file:///c:/Users/ducth/./gemini/antigravity/scratch/investment-tracking/DECISION_LEDGER.md)**: Forensic record of past bugs and established logic.
- **[PROJECT_MEMENTO.md](file:///c:/Users/ducth/./gemini/antigravity/scratch/investment-tracking/PROJECT_MEMENTO.md)**: Long-term state and project DNA.

> [!IMPORTANT]
> **Living Document Protocol**: These files are NOT static. You MUST update them before ending a task to ensure the next AI session has the full latest context. Think of this as "committing to long-term memory."

---

## 🗺️ 1. Project Navigation (Monorepo Structure)

The Digital HQ is now a unified monorepo. Satellite Scout lives as a subfolder.

| Component | Path | Domain |
|-----------|------|--------|
| **The Vault** | `investment-tracking/` | Portfolio Math, Dashboard UI, PnL, AI Strategist. |
| **Satellite Scout** | `investment-tracking/satellite/` | Web Scraping, Mission Scheduling, Port 4000 API. |
| **The Thinker** | `investment-tracking/thinker/` | DeFi Protocol Analyst, Strategy Interrogation, Port 4001. |

### 🛠️ Navigation Rules
- **"Vault Issue"**: ROI, PnL, Transactions, Dashboard → **Check `src/`**
- **"Scout/Satellite Issue"**: Scraping, Selector fixes, Watchtower → **Check `satellite/`**

---

## 🏗️ 2. System Blueprint (File Map)

Use this map to locate specific logic without extensive searching.

### **[THE VAULT] Component**
- **Core Orchestration**: `src/App.tsx` (Hook initialization, Routing, Lazy Loading).
- **Accounting & ROI**: `src/services/accountingService.ts` (Journaling), `src/domain/portfolioCalculator.ts` (Math).
- **Price Management**: `src/services/priceService.ts` (Multi-source fetcher), `src/hooks/usePriceFeeds.ts` (State hook).
- **Portfolio State**: `src/hooks/usePortfolio.ts` (IndexedDB sync, Web Worker bridge).
- **Intelligence Sync**: `src/services/IntelligenceSyncService.ts` (Satellite -> Vault bridge).
- **Thinker Bridge**: `src/services/ThinkerBridge.ts` (Vault -> Thinker Analyst bridge).
- **API Fallbacks**: `src/services/FearGreedService.ts`, `src/services/GlobalMarketService.ts`.
- **Data Scout Module**: `src/services/scout/` (ScoutAliasService, ScoutTransformer, etc).
- **Thinker UI**: `src/components/thinker/` (ThinkerSetup, IntelDossier).
- **Operations Console**: `ops-console/`.
- **Desktop Bridge**: `electron/` (Packaged with portable Node.js v22 for auto-start).
- **Database Logic**: `src/services/database/`.
- **Thinker Bridge**: `src/services/ThinkerBridge.ts` (Vault -> Thinker Analyst bridge).
- **API Fallbacks**: `src/services/FearGreedService.ts`, `src/services/GlobalMarketService.ts`.
- **Data Scout Module**: `src/services/scout/` (ScoutAliasService, ScoutTransformer, etc).
- **Thinker UI**: `src/components/thinker/` (ThinkerSetup, IntelDossier).
- **Operations Console**: `ops-console/`.
- **Desktop Bridge**: `electron/` (Packaged with portable Node.js v22 for auto-start).
- **Database Logic**: `src/services/database/` (Data persistence).

### **[THE THINKER] Component** (`thinker/` subfolder)
- **Think-Engine**: `thinker/src/ThinkerEngine.js` (Legacy Gemini API interrogation logic).
- **Deliberation-Engine**: `thinker/src/DeliberationEngine.js` (Multi-agent Bull/Bear/DeFi reasoning).
- **Context Hub**: `thinker/src/ContextManager.js` (Vault data via Antigravity Proxy).
- **API Server**: `thinker/server.js` (Express-based, Port 4001).
  - `POST /api/deliberate`: Triggers 4-agent consensus analysis.
  - `GET /api/brief`: Daily market intelligence.

### **[SATELLITE SCOUT] Component** (`satellite/` subfolder)
- **Scraper Engine**: `satellite/scoutEngine.js` (Puppeteer multi-tab extraction with stealth).
  - **Memory Optimized**: 2 tabs max, 5-mission recycle threshold, 512MB heap limit.
- **Scheduler**: `satellite/src/Watchtower.js` (Background mission management with fallback chains).
- **API Server**: `satellite/server.js` (Express-based, Port 4000).
- **Mission Registry**: `satellite/presets.json` (URLs, selectors, fallbacks, stealth params).
  - **Correction (Jan 2026)**: PUMP_PRICE selector/URL fixed for CoinMarketCap individual page.
- **Database**: `satellite/scout_intelligence.db` (SQLite for harvested intel).

#### Satellite API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/status` | GET | Health check |
| `/intel/vault` | GET | Returns harvested records for HQ sync |
| `/intel/trends` | GET | Trend data with 1D/2D/5D/7D changes |
| `/aliases` | GET | Returns centralized token mappings (MET -> meteora) |
| `/presets` | GET/POST/PUT/DELETE | Mission CRUD |
| `/scheduler/start` | POST | Start Watchtower |

#### Fallback Chain Schema (Phase 95)
```json
{
  "url": "https://tradingview.com/...",
  "selector": ".js-symbol-last",
  "fallbacks": [{ "url": "https://coinmarketcap.com/...", "selector": "..." }]
}
```

#### Token Alias Map (`satellite/aliases.json`)
Resolves ambiguous symbols to correct API identifiers:
```json
{
  "MET": { "coingeckoId": "meteora", "cmcSlug": "meteora" },
  "XT": { "coingeckoId": "xt-com", "cmcSlug": "xt-com" }
}
```

---

## ️ 3. Domain Data Map (Core Types)

| Object | Key Fields | Logical Source |
|--------|------------|----------------|
| **Transaction** | `type`, `amount`, `paymentCurrency`, `linkedTransactionId`, `isCompound`, `createdAt` | `usePortfolio.ts` |
| **Asset** | `totalInvested`, `averageBuyPrice`, `lpRange`, `compoundedPrincipal` | `useDashboardCalculations.ts` |
| **Price Data** | `price`, `change24h`, `volume24h`, `source` | `PriceService.ts` |
| **Notification** | `telegramChatId`, `geminiApiKey`, `scoutAutomationEnabled` | `Settings UI / IndexedDB` |

---

## 🎯 4. Strategic Goals (The "Golden Trio")

1.  **Zero-Friction Performance**: 60fps UI. No blocking loaders. All heavy lifting (Scouts, Math) stays in the background.
2.  **High-Fidelity Data**: Accuracy above all. Prioritize "Data Truth Hierarchy" (Agentic > API > Cache).
3.  **Execution-Ready Environment**: Focused UI. No noise. Instant access to "What-If" planning and accumulation progress.

---

## ☁️ 5. Cloud Vault & Supabase Operations

- **Restoration**: The app uses a Supabase Free Tier project. If it "Pauses" due to inactivity (Symptom: Sync Failed / 404/500 errors), you MUST manually "Restore" it via the Supabase Dashboard. Restoring takes ~5 minutes.
- **Resilience (Phase 94)**: Optimized with Base64 chunking for large payloads.
- **Performance (Phase 97)**: RLS policies optimized by wrapping `auth.uid()` in subqueries `(select auth.uid())` to prevent row-by-row re-evaluation and resolve Supabase dashboard warnings.

---

## 🛡️ 3. Project Rules (Non-Negotiable)

- **Rule 6.1 (Identity Tagging)**: Every single response **MUST** begin with your active role tag in bold (e.g., **[STRATEGIST]**).
- **Rule 6.2 (Strict Execution Boundary)**: You **MUST NOT** execute code changes or system actions proactively. All implementation phases require explicit user approval (e.g., "Proceed", "Approved", or "Do it") after the Planning phase is presented via `implementation_plan.md`. No "hyper-execution" based on implicit assumptions.
- **Security First**: Absolute Zero-Hardcode Policy for API keys or private data.
- **Git Policy**: **NO** `git push` or `git commit` unless explicitly requested by the user.
- **Data Integrity**: LEAVE THE PAST ALONE. Do not apply new formulas to transactions before Dec 27, 2025.
- **Theme**: Dark Mode First. Use `slate-900` / `cyan-400` / `indigo-500` palette.

---

## 🏗️ Phase 91: Bidirectional Intelligence Feedback Loop

**Status:** Completed ✅

**Logic:**
1. **Priority Re-Scout**: User feedback (`!bad` / `/verify`) triggers an immediate re-scan.
2. **Interactive Reports**: Satellite replies with fresh values and discrepancy analysis.
3. **Automated Resolution**: Discrepancies confirmed by forensics automatically update the Hub Vault (`intel_records`).
4. **Precision Sync**: Individual high-fidelity persistence for `BTC.D`, `USDT.D`, and `USDC.D`.

---

## 🛡️ Phase 93: Hybrid Intelligence Architecture
**Status:** Completed ✅
1. **API Fallbacks**: Direct polling for Global Metrics (CoinGecko) and Sentiment (Alternative.me) if Scout is offline.
2. **Indicator Trends 2.0**: Support for 1D, 2D, 5D, and 7D change badges.
3. **New Services**: `FearGreedService.ts`, enhanced `GlobalMarketService.ts`.

---

## 🔱 Phase 94: Cloud Vault Resilience
**Status:** Completed ✅
1. **Performance**: Base64 chunking for large encrypted blobs.
2. **Efficiency**: Pruned cloud payloads for faster sync.

---

## 🎯 Phase 95: Scoped Redundancy (Scout Fallbacks)
**Status:** Completed ✅
1. **Fallback Chains**: Recursive mission execution if primary source failing (TradingView -> CoinMarketCap).
2. **Stealth Preservation**: Fallback attempts use same human-simulated delays.
---

## 🛰️ Phase 96: Token Alias Integration
**Status:** Completed ✅
1. **Satellite**: New `GET /aliases` serves `aliases.json` map.
2. **Vault**: `ScoutAliasService.ts` provides centralized resolution for ambiguous tokens (e.g., MET, XT).
3. **Price Engine**: `priceService.ts` prioritizes alias lookup before hardcoded maps or API searches.

---

## ⚡ Phase 97: Supabase RLS Optimization
**Status:** Completed ✅
1. **Performance**: All RLS policies for `user_vaults` and `vault_snapshots` rewritten to use subquery-cached authentication: `(select auth.uid())`.
2. **Alerts**: Resolved "Auth RLS Initialization Plan" warnings in Supabase Health dashboard.

---

## 📦 Phase 100: All-in-One Production Build
**Status:** Completed ✅
1. **Packaging**: Bundled Electron + Satellite into a single NSIS installer (`Digital HQ Setup.exe`).
2. **Persistence**: Configurable installation to `H:\DigitalHQ` to preserve primary disk space.
3. **Engine Isolation**: Bundled **Portable Node.js (v22)** in `resources/portable-node/` to allow background services (Scout/Thinker) to run without needing a system-wide Node.js installation.

---

## 🧠 Phase 101: Thinker Service (Project Intelligence)
**Status:** Completed ✅
1. **Multi-Agent Deliberation**: Implemented `DeliberationEngine.js` with Bull, Bear, DeFi, and Synthesizer roles.
2. **Scout Integration**: Agents automatically pull live market data (FGI, BTC.D, TVL) to anchor their reasoning.
3. **API Layer**: Distributed `thinker/` process on Port 4001 with `/api/deliberate`.
4. **Interrogation UI**: Integrated into the "Intelligence" tab for project dossier management.

---

## 🛰️ Phase 102: Satellite Stability & Precision
**Status:** Completed ✅
1. **Memory Resilience**: Resolved 2GB+ memory heap crashes by limiting to 2 tabs and aggressive 5-mission recycling.
2. **PUMP Precision**: Fixed PUMP_PRICE scraping logic in `presets.json` to target CoinMarketCap currency pages with updated selectors.
3. **Stealth Buff**: Increased random wait times (up to 45s) for high-detection sites like CoinMarketCap.

---

## 🔱 4. Operational Roles

| Role | Focus | Responsibility |
|------|-------|----------------|
| **[STRATEGIST]** | Market Intel | Yield analysis, buy signals, and IL risk management. |
| **[ARCHITECT]** | System Design | Database schemas (IndexedDB) and high-level technical planning. |
| **[BUILDER]** | Implementation | React, TypeScript, and premium UI aesthetics. |
| **[CRITIC]** | Verification | Math validation, survival tests, and code health audits. |
| **[SECURITY]** | Safety | Privacy audits, dependency vetting, and Zero-Hardcode enforcement. |
| **[DATA_ACCOUNTANT]** | Logic | Forensic ledger auditing and complex transaction mapping. |
| **[SCOUT]** | Harvesting | External data extraction missions (Puppeteer/Satellite). |

---

## 🔄 6. Intelligence Flow
**Satellite** (Scrape to SQLite) -> **Satellite Server** (Port 4000) -> **Vault Sync Service** (Fetch to State).

---

## 🔌 8. Critical Scripts
- **Launch Everything**: `Launch Digital HQ.bat` (Port 5188 + Electron).
- **Satellite Start**: `npm start` in `scout-for-investment-tracking`.
- **Vault Dev**: `npm run dev` in `investment-tracking`.

---

## 🧠 9. Environment Context
- **Caches**: `localStorage` (Price IDs, Chart Data), `IndexedDB` (Transactions, Intelligence).
- **Ports**: Vault (5173/5188/3000), Satellite (4000).
- **Auto-Sync**: Must be disabled before mass data imports/restores.

---

## 📜 10. Automated Workflows
Refer to `.agent/workflows/` for step-by-step procedures:
- `fix-satellite-sync.md`: Troubleshooting the Port 4000 pipeline.
- `audit-portfolio-math.md`: Verifying ROI and PnL integrity.

> [!IMPORTANT]
> Always verify that labels in Satellite's `presets.json` (e.g., `BTC_DOM`) match the keys in Vault's `IntelligenceSyncService.ts`.

---

## 🧪 11. Test Coverage

Critical financial logic is covered by unit tests. Run with:
```bash
npm run test
```

| Test File | Coverage Area |
|-----------|---------------|
| `accountingService.test.ts` | Journal entries, ledger balances, account classification |
| `portfolioCalculator.test.ts` | Asset calculation, DCA, rewards, withdrawals, compounding |
| `priceService.test.ts` | Price formatting, open price derivation |

---

## 🔧 12. Maintenance Notes

**Last Dependency Audit**: January 2026
- Safe packages updated (React, Supabase, Recharts, TailwindCSS, etc.)
- Electron pinned at v34 (v39 requires dedicated migration)
- Run `npm outdated` periodically to check for updates
- Run `npm audit` to check for security vulnerabilities

---

## 📱 13. PWA Offline Support

The app uses Workbox for intelligent offline caching:

| Cache | Strategy | TTL | Purpose |
|-------|----------|-----|---------|
| `coingecko-cache` | StaleWhileRevalidate | 4h | Price data |
| `defillama-cache` | StaleWhileRevalidate | 6h | DeFi TVL metrics |
| `hyperliquid-cache` | NetworkFirst | 30m | Perp prices |
| `scout-cache` | NetworkFirst | 1h | Satellite Scout API |
| `google-fonts-*` | CacheFirst | 1yr | Typography |

**Offline Behavior**: The app will show cached prices if network is unavailable, ensuring you can always view your portfolio.

