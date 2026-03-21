# DECISION LEDGER: System Protocols & Bug Resolutions

**[ARCHITECT speaking]**  
This ledger is a permanent record of technical decisions and established logic. **Check this before every implementation.**

**Purpose:** Prevent repeating past mistakes, document "why" decisions were made.

---

## Architectural Decisions (Most Recent First)

| Entry ID | Date | Module | Root Cause / Question | Established Logic / Fix |
|:---|:---|:---|:---|:---|
| **DL-025** | 2026-01-14 | **Education System** | Zero knowledge baseline - user needs structured learning. | Created ROLES.md (10 AI agents), CONTEXT.md (transferable knowledge), LEARNING_CURRICULUM.md (16-week plan from basics). |
| **DL-024** | 2026-01-14 | **Testing** | No test data = losing time debugging with manual entry. | Created `scripts/seedTestData.ts` - auto-populate 7 realistic test transactions (BTC, ETH, SOL, HYPE, PUMP). |
| **DL-023** | 2026-01-14 | **Data Import** | Legacy backup import failing - wrote to localStorage but app uses IndexedDB. | **IndexedDB Priority:** Modified `ExportService.importSnapshot()` to write via `TransactionService.bulkImport()` instead of localStorage. |
| **DL-022** | 2026-01-14 | **Deployment** | Chrome vs Electron confusion - which to use for production? | **Chrome Recommended:** Cloud Vault works, no CSP issues, better DevTools. Electron for advanced users only (has CSP conflicts with Vite). |
| **DL-021** | 2026-01-13 | **Electron** | Cloud Vault restore timing out with "AbortError" in Electron. | **Root Cause:** Vite dev server sends CSP headers blocking Supabase. **Fix:** Disabled `webSecurity: false` in Electron (nuclear option). **Proper Fix:** Configure Vite to not send CSP in dev mode (de ferred). |
| **DL-020** | 2026-01-13 | **Supabase RLS** | `INSUFFICIENT_PERMISSION` errors despite user being authenticated. | **RLS Subquery Pattern:** All policies must use `(select auth.uid()) = user_id` instead of direct `auth.uid()` to avoid RLS initialization errors. |
| **DL-019** | 2026-01-12 | **UX** | Unable to track input order for transactions on the same date. | **Input Timestamping:** Added `createdAt` field and "Created" column to Recent Transactions with `dd/mm/yyyy hh:mm:ss` format. |
| **DL-018** | 2026-01-12 | **Supabase** | RLS initialization causing "Auth RLS Initialization Plan" performance alerts. | **RLS Subquery Fix:** Wrap `auth.uid()` in a subquery `(select auth.uid())` in all security policies. |
| **DL-017** | 2026-01-12 | **Price Engine** | Symbol ambiguity (e.g., MET → meteora vs MET-token). | **Alias Integration:** Created centralized `aliases.json` in Satellite and `ScoutAliasService` in Vault to resolve symbols before reaching API fetchers. |
| **DL-016** | 2026-01-11 | **Sync Service** | Telegram notifications showing stale dominance data vs Dashboard. | **Sync Persistence Fix:** Explicitly call `PriceDataService.saveManualPrice` for `BTC.D`, `USDT.D`, and `USDC.D` during every sync pulse. |
| **DL-015** | 2026-01-11 | **Phase 91** | Disconnect between user feedback and Hub database. | **Bidirectional Feedback:** Automatic discrepancy resolution triggers a Vault update (`intel_records`) immediately upon forensic confirmation. |
| **DL-014** | 2026-01-11 | **Reporting** | No visibility on data freshness. | Added `⚠️ STALE` tag for metrics older than 60 minutes in Telegram replies. |
| **DL-013** | 2026-01-11 | **NotificationBridge** | `CAPTURED` alerts not sending Telegram reports. | **Root Cause:** `triggerForensicInvestigation` method was missing. Restored it. |
| **DL-012** | 2026-01-11 | **ScoutEngine** | "Engine Busy" errors when 2+ forensics ran in parallel. | Expanded to **5 concurrent tabs** + `waitForTab(60s)` queue. |
| **DL-011** | 2026-01-11 | **Scout Selectors** | Dominance metrics (USDT.D, USDC.D) returning **change percentage** instead of absolute value. | Selector Fix: Use `.js-symbol-last` for TradingView dominance (not `.js-symbol-change-pt`). |
| **DL-010** | 2026-01-11 | **Bridge** | Telegram bot was one-way (acknowledge only). | Upgraded to two-way with Auto-Mapping and real-time price replies. |
| **DL-009** | 2026-01-11 | **UI/UX** | No real-time insight into background Scout activity. | Added "Neural Pulse" indicator to header + Background Log Feed. |
| **DL-008** | 2026-01-11 | **UI/UX** | No visibility into user-flagged data. | Created "FIDELITY COMMAND" tab in Scout Satellite for alert management. |
| **DL-007** | 2026-01-11 | **Bridge** | Satellite was "deaf" to Telegram commands. | Auto-trigger `NotificationBridge.startListening()` on config push. |
| **DL-006** | 2026-01-11 | **UI/UX** | Current UI lacks technical density for expert analysis. | Shift to **Bloomberg Terminal Vision** (High density, neon on black). |
| **DL-005** | 2026-01-05 | **Naming** | Build failures due to Linux/Windows case-sensitivity. | **Permanent Protocol:** All service/component filenames MUST be PascalCase. |
| **DL-004** | 2026-01-06 | **Git Security** | Accidental `git push` attempts. | **Strict Rule:** No `push` or `commit` without explicit user permission. |
| **DL-003** | 2026-01-07 | **Sync Service** | Direct fetch to Satellite caused mission duplication. | Use `ExternalScoutService` bridge only. Never direct-fetch missions. |
| **DL-002** | 2026-01-08 | **LP Math** | `Sol-USDC` names with dashes caused parsing failures. | **Protocol:** Use `isLP()` with dash/space guards + `decomposeLP()` for asset parsing. |
| **DL-001** | 2026-01-10 | **ScoutLauncher** | `npm start` was headless; terminal closed on crash. | Use `npm run desktop` + `cmd.exe /k`. Terminal MUST stay open for debug visibility. |

---

## Design Philosophy Decisions

### Why IndexedDB over LocalStorage?
**Date:** 2026-01-06  
**Decision:** Use IndexedDB as primary storage, LocalStorage for settings only

**Rationale:**
- **Capacity:** IndexedDB supports GBs, localStorage only 5-10MB
- **Performance:** Indexed queries vs key-value scanning
- **Transactions:** ACID compliance for data integrity
- **Asynchronous:** Doesn't block UI thread

**Files Affected:** `src/services/database/*`, all data hooks

---

### Why Scout-First Price Resolution?
**Date:** 2026-01-12  
**Decision:** Check Scout API before using external APIs (CoinGecko, CMC)

**Rationale:**
1. **Control:** We control Scout's scraping frequency
2. **Niche Tokens:** APIs don't have PUMP, HYPE, etc.
3. **Visual Truth:** Scout sees what humans see (rendered HTML)
4. **No Rate Limits:** Scout scrapes on our schedule

**Order:** Scout → Hyperliquid → CoinGecko → Cache

**Files Affected:** `src/services/PriceService.ts`

---

### Why Multi-Agent Thinker?
**Date:** 2026-01-09  
**Decision:** Use 3 specialized AI agents + 1 synthesizer instead of single AI call

**Rationale:**
- **Hallucination Reduction:** Agents balance each other
- **Transparency:** User sees Bull vs Bear arguments
- **Confidence Scores:** Synthesizer weighs strength
- **Specialization:** Each agent has domain expertise

**Files Affected:** `thinker/src/DeliberationEngine.js`

---

### Why Supabase over Firebase?
**Date:** 2025-12-28  
**Decision:** Use Supabase for Cloud Vault

**Rationale:**
- **Real SQL:** PostgreSQL, not NoSQL - better for complex queries
- **RLS:** Row-level security at database level
- **Open Source:** Can self-host if needed
- **Better Auth:** Email + Google + magic links built-in

**Files Affected:** `src/services/CloudSyncService.ts`, `src/services/supabase.ts`

---

### Why Chrome Recommended over Electron?
**Date:** 2026-01-14  
**Decision:** Recommend Chrome at `localhost:5174` as primary development environment

**Rationale:**
1. **Cloud Vault Works:** No CSP conflicts with Supabase
2. **Better DevTools:** Chrome DevTools > Electron's
3. **Hot Reload:** Vite instant updates
4. **Simpler:** No Electron build process

**Electron Use Case:** Advanced users wanting system tray, auto-launch

**Files Affected:** `QUICKSTART.md`, `ARCHITECTURE.md`

---

## Technical Debt / Warning Zones

### Critical Components (Do Not Touch Without Testing)

| Component | Warning | Why Critical |
|:---|:---|:---|
| **Electron Version** | Pinned at v34 | Newer versions break native modules (better-sqlite3) |
| **SQLite Port** | Hardcoded 4000 | Changing breaks Vault → Scout communication |
| **Puppeteer** | Headless only | Headful causes memory leaks on long sessions |
| **Scout Browser Recycling** | Every 5 missions | Prevents memory leaks |
| **IndexedDB Migrations** | No auto-migration | Must manually handle schema changes |

---

### Known Limitations (Acceptable Trade-offs)

**1. Scout Scraping Speed**
- **Limitation:** Full 68-mission cycle takes ~15 minutes
- **Trade-off:** Stealth (human delays) vs speed
- **Decision:** Prioritize stealth to avoid rate-limiting/blocking

**2. Electron CSP Conflict**
- **Limitation:** Cloud Vault doesn't work in Electron
- **Root Cause:** Vite dev server sends CSP headers
- **Workaround:** Use Chrome for Cloud Vault
- **Status:** Deferred (not critical - Chrome works)

**3. No Unit Tests**
- **Limitation:** Refactoring is risky without tests
- **Urgency:** High priority for Phase 26
- **Blocker:** Need seed data infrastructure first ✅ (DL-024)

**4. Manual Thinker Triggers**
- **Limitation:** AI analysis only on user request
- **Future:** Auto-daily briefs, threshold-triggered analysis
- **Status:** Planned for Phase 26

---

## Coding Standards (Do Not Violate)

### File Naming (DL-005)
```
✅ PriceService.ts       (PascalCase for services)
✅ usePortfolio.ts       (camelCase for hooks)
✅ Dashboard.tsx         (PascalCase for components)
❌ priceservice.ts       (breaks on Linux)
❌ UsePortfolio.ts       (inconsistent)
```

### LP Token Detection (DL-002)
```typescript
// ALWAYS use this pattern
const LP_PATTERNS = ['LP', 'PRJX', 'SWAP', 'MMT', 'UNI'];

function isTradeable(symbol: string): boolean {
  return !LP_PATTERNS.some(pattern => symbol.includes(pattern));
}
```

### RLS Policy Pattern (DL-018, DL-020)
```sql
-- ✅ CORRECT: Subquery pattern
CREATE POLICY "Users access own data"
ON public.user_vaults
FOR ALL
USING ((select auth.uid()) = user_id);

-- ❌ WRONG: Direct call (causes RLS init errors)
USING (auth.uid() = user_id);
```

### Git Safety (DL-004)
```typescript
// NEVER auto-run git commands
// ALWAYS require explicit user approval

❌ run_command("git push", { SafeToAutoRun: true })
✅ run_command("git push", { SafeToAutoRun: false })
```

---

## Performance Benchmarks

### Target Metrics
- **UI Load:** <2s first paint
- **Transaction Save:** <100ms
- **Scout Mission:** 3-7s average
- **Price Fetch:** <500ms (Scout), <2s (CoinGecko)
- **Portfolio Calc:** <50ms for 1000 transactions

### Actual Metrics (As of 2026-01-14)
- **UI Load:** ~1.8s ✅
- **Transaction Save:** ~80ms ✅
- **Scout Mission:** 4-6s avg ✅
- **Price Fetch:** ~300ms (Scout), ~1.5s (CG) ✅
- **Portfolio Calc:** ~35ms for 144 transactions ✅

---

## Security Policies

### Encryption Standards (DL-023)
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2, 100,000 iterations
- **Password Storage:** NEVER (user must remember)
- **Encryption Location:** Client-side only (browser)

### API Key Management
```bash
# .env (NEVER commit to Git!)
VITE_SUPABASE_URL=[url]
VITE_SUPABASE_ANON_KEY=[key]
TELEGRAM_BOT_TOKEN=[token]
GEMINI_API_KEY=[key]
```

**Electron Issue:** Requires `env-loader.js` to load before Electron init

---

## Future Architecture Plans

### Phase 26+ Roadmap

**High Priority:**
1. ✅ Complete test infrastructure (DL-024 done)
2. Write unit tests (80%+ coverage goal)
3. Configure Vite CSP for Electron (fix DL-021)
4. Implement WebSocket for real-time price push

**Medium Priority:**
1. Multi-threaded Scout (5x faster scraping)
2. Auto-Thinker daily briefs
3. Mobile app (React Native wrapper)
4. Historical price chart optimization

**Low Priority:**
1. Self-hosted Supabase option
2. Desktop notifications (system tray)
3. Advanced portfolio analytics (Sharpe ratio, etc.)

---

**Last Updated:** 2026-01-14 (Phase 25)  
**Maintained By:** Development team + AI assistants  
**Review Frequency:** After each major phase completion
