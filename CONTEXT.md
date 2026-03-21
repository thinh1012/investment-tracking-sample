# 📘 CONTEXT.md - AI Assistant Project Knowledge

> **Purpose:** This file provides transferable project context for AI assistants (Claude, ChatGPT, etc.) when resuming development or switching between sessions.

---

## 🎯 Project Overview

**Name:** Digital HQ - Investment Intelligence System  
**Type:** Multi-service monorepo (Vault + Scout + Thinker)  
**Primary Goal:** Track crypto portfolio, automate price scraping, and provide AI-powered market analysis

**What Makes This Special:**
- **No external APIs for prices** - We scrape CoinMarketCap & TradingView ourselves
- **AI-powered analysis** - Multi-agent deliberation system for research
- **Offline-first** - IndexedDB as single source of truth, cloud backup optional

---

## 🛠️ Tech Stack

### The Vault (Main UI)
- **Framework:** React 18 + TypeScript 5.3
- **Build Tool:** Vite 5.1
- **Styling:** Tailwind CSS 3.4
- **State:** React Context API (no Redux)
- **Storage:** IndexedDB (primary), LocalStor age (settings only)
- **Desktop:** Electron 28 (optional, has CSP limitations)
- **Cloud Backup:** Supabase (PostgreSQL + Auth + RLS)

### Scout Satellite (Data Scraper)
- **Runtime:** Node.js 22
- **Scraping:** Puppeteer (headless Chrome)
- **Storage:** SQLite (`scout_intelligence.db`)
- **Server:** Express.js on port 4000

### The Thinker (AI Service)
- **Runtime:** Node.js 22
- **AI:** Google Gemini 3.0 Flash
- **Server:** Express.js on port 4001
- **Analysis:** Multi-agent deliberation (Bull, Bear, DeFi, Synthesizer)

---

## 📁 Project Structure

```
investment-tracking/
├── src/                          # Vault React app
│   ├── components/               # UI components
│   ├── hooks/                    # React hooks (data, cloud sync)
│   ├── services/                 # Business logic
│   │   ├── database/             # IndexedDB wrappers
│   │   ├── ExportService.ts      # Backup/restore
│   │   ├── PriceService.ts       # Price fetching (Scout-first)
│   │   └── CloudSyncService.ts   # Supabase auto-sync
├── electron/                     # Desktop wrapper
│   ├── main.js                   # Electron main process
│   ├── env-loader.js             # Loads .env for Supabase
│   └── preload.js                # IPC bridge
├── satellite/                    # Scout service
│   ├── server.js                 # Express API
│   ├── scoutEngine.js            # Puppeteer scraper
│   ├── presets.json              # Mission configs
│   └── database.db               # SQLite price cache
├── thinker/                      # AI service
│   ├── server.js                 # Express API
│   └── agents/                   # Multi-agent system
├── .env                          # Secrets (never commit!)
├── ARCHITECTURE.md               # System design
├── ROLES.md                      # Agent definitions
└── CONTEXT.md                    # This file
```

---

## 🔑 Key Commands

### Development (Recommended: Chrome)
```powershell
npm run dev                   # Start Vite (Port 5174)
npm run start-satellite       # Start Scout (Port 4000)
npm run start-thinker         # Start Thinker (Port 4001) [Optional]
```

### Electron Desktop
```powershell
npm run start-desktop         # Electron only (needs Vite running)
npm run start-hq              # Orchestrator (buggy, use manual commands)
```

### Testing & Build
```powershell
npm run test                  # Unit tests (Vitest)
npm run build                 # Production Vite build
npm run preview               # Preview production build
```

### Data Management
```powershell
npm run seed-test-data        # [TODO] Populate test transactions
npm run backup-db             # [TODO] Backup IndexedDB to JSON
```

---

## 🧠 Core Architecture Decisions

### Why IndexedDB over LocalStorage?
- **Capacity:** IndexedDB supports GBs, localStorage only 5-10MB
- **Performance:** Indexed queries, not key-value scanning
- **Transactions:** ACID compliance for data integrity

### Why Scout Instead of APIs?
- **No Rate Limits:** We control scraping frequency
- **Niche Tokens:** CoinGecko/CMC Free APIs don't have PUMP, HYPE, etc.
- **Data Ownership:** Full historical price records in local SQLite

### Why Electron AND Chrome?
- **Electron:** System tray, offline app feel, auto-launch
- **Chrome:** Better debugging, Cloud Vault works (no CSP issues)
- **Current State:** Chrome recommended due to Vite CSP conflicts in Electron

### Why Supabase over Firebase?
- **PostgreSQL:** Real SQL, not NoSQL - easier for complex queries
- **RLS (Row Level Security):** User data isolation at DB level
- **Open Source:** Can self-host if needed

---

## 📊 Data Flow

### Price Updates (Scout → Vault)
1. **Watchtower** triggers missions based on `presets.json` schedule
2. **Scout Engine** (Puppeteer) scrapes CoinMarketCap/TradingView
3. **Scout SQLite** stores prices with timestamp
4. **Vault** polls Scout API (`/intel/vault`) for latest prices
5. **PriceService** checks Scout first, falls back to direct APIs if Scout offline

### Transaction Storage (Vault)
```
User Input → TransactionForm
         ↓
    useTransactionData hook
         ↓
    TransactionService.add()
         ↓
    IndexedDB ('transactions' store)
         ↓
    Auto-sync to Supabase (every 30min)
```

### Cloud Sync (Vault ↔ Supabase)
- **Upload:** Every 30 minutes via `CloudSyncService.ts`
- **Encryption:** AES-256 with user password (never stored)
- **Storage:** `public.user_vaults` table with RLS policies
- **Download:** Manual via Cloud Vault UI

---

## 🚨 Known Issues & Limitations

### Electron Cloud Sync CSP Conflict
- **Problem:** Vite dev server sends CSP headers blocking Supabase in Electron
- **Workaround:** Use Chrome for Cloud Vault, or import via JSON snapshot
- **Status:** Not fixed - low priority (Chrome works perfectly)

### Scout Cache Access Errors (Windows)
- **Issue:** Puppeteer cache files denied on Windows
- **Impact:** Non-critical warnings in logs
- **Fix:** Ignored - doesn't affect functionality

### LP Token Filtering
- **Challenge:** Liquidity Pool tokens (SUI-USDC LP) don't have tradeable prices
- **Solution:** Filter out symbols containing "LP", "PRJX", "SWAP", "MMT"
- **Status:** Implemented in `PriceService.ts`

---

## 🧪 Testing Strategy

### Current State
- **Unit Tests:** ✅ Implemented (60+ tests passing)
- **Integration Tests:** ❌ None
- **Manual Testing:** ✅ Done after every feature
- **Test Data:** ⚠️ Partially automated (use transaction seeds)

### Planned Improvements
1. **Full Integration Tests** - E2E tests for UI flows
2. **Documentation** - Maintain sync between logic and .md files
3. **Education** - Learning curriculum for user

---

## 🔐 Security & Secrets

### Environment Variables (.env)
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-key]
TELEGRAM_BOT_TOKEN=[bot-token]
TELEGRAM_CHAT_ID=[your-chat-id]
GEMINI_API_KEY=[ai-key]
```

**CRITICAL:** Never commit `.env` to Git!

### Encryption
- **Cloud Vault:** AES-256-GCM via `crypto.subtle`
- **Password:** User-defined "sync key" (never sent to server)
- **Storage:** Encrypted blob in Supabase `encrypted_data` column

---

## 📖 Coding Conventions

### TypeScript
- **Strict Mode:** ✅ Enabled
- **Interfaces:** Prefer `interface` over `type` for objects
- **Null Safety:** Use optional chaining `?.` and nullish coalescing `??`

### React
- **Components:** Functional components only (no classes)
- **Hooks:** Extract complex logic into custom hooks
- **Context:** Use for global state (auth, settings)
- **Props:** Destructure at function signature

### Naming
- **Files:** PascalCase for components (`Dashboard.tsx`), camelCase for services
- **Variables:** camelCase (`transactionList`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Booleans:** Prefix with `is`, `has`, `should` (`isLoading`, `hasError`)

### Comments
- **When:** Complex logic, business rules, "why" not "what"
- **Format:** Single-line `//` for inline, JSDoc `/** */` for functions
- **Bad:** `// Set x to 5` (obvious)
- **Good:** `// Hard-coded limit to prevent UI freeze on large portfolios`

---

## 🎓 Learning Resources

### For User (Starting from 0)
- **JavaScript:** [javascript.info](https://javascript.info) (comprehensive tutorial)
- **TypeScript:** [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **React:** [React Docs (Beta)](https://react.dev) - Focus on "Learn React" section
- **Async/Promises:** [MDN Async Guide](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- **IndexedDB:** [Working with IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

---

## ⚙️ Current Development Status

**Phase 25:** Intelligence Refinement & Monitoring [IN PROGRESS]
- ✅ Implemented Pool Screener with ETH/SOL/SUI support
- ✅ Enhanced Quad-Tier Price Escalation
- ✅ Configured Daily briefings (8 AM / 8 PM)
- ✅ Verified 60+ unit tests passing

**Next Priorities:**
1. **Refine Thinker Briefings** - Integration with on-chain data
2. **Scout Fidelity** - Skip incorrect token prices for automated alerts
3. **Scalability** - Optimize price polling for large watchlists

---

## 🤔 When to Update This File

**Add entries when:**
- New service added (e.g., "Notification Bridge")
- Architecture decision made ("Why X over Y")
- Major bug discovered and fixed
- New convention established

**Update frequency:** After each Phase milestone

---

## 📞 How AI Should Use This File

1. **On Session Start:** Read this file first for full context
2. **When Asked "Why?":** Reference architecture decisions
3. **Before Major Changes:** Check conventions and patterns
4. **When Teaching:** Use learning resources section
5. **When Debugging:** Check "Known Issues" first

**Remember:** User is learning from scratch. Explain concepts clearly, use analogies, and challenge understanding per ROLES.md.

---

**Last Updated:** 2026-01-24 (Phase 25 updates)  
**Maintained By:** Development team + AI assistants  
**Next Review:** After Phase 26 completion
