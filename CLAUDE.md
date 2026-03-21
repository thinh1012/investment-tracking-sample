# CLAUDE.md - AI Assistant Context

> **Read this file at the start of every session.**

---

## 🎯 Project Overview

**Digital HQ** - A crypto investment tracking application with three services:

| Service | Tech | Purpose |
|---------|------|---------|
| **Vault** | React + IndexedDB | Frontend UI, portfolio management |
| **Satellite (Scout)** | Node.js + SQLite | Price scraping, Telegram bot, alerts |
| **Thinker** | Node.js | AI analysis, daily briefs, deliberation |

---

## 📂 Key Files to Read

<context>
- `CONTEXT.md` - Full project overview
- `DECISIONS.md` - WHY choices were made
- `task.md` (in brain folder) - Current work items
- `ARCHITECTURE.md` - System design
</context>

---

## 🚫 Rules

<instructions>
1. **Don't over-engineer** - Only make changes directly requested
2. **Read before editing** - ALWAYS read files before proposing changes
3. **Keep it simple** - Don't add features beyond what was asked
4. **No Hardcoded Secrets** - NEVER hardcode API keys or secrets. Use `.env` files. **NEVER** upload `.db`, `.env`, or `.key` files to GitHub.
5. **Verify work** - Run tests or check console after changes
6. **Update task.md** - Mark items done as you complete them
</instructions>

---

## 🔧 Common Commands

```bash
# Start services
cd satellite && npm start    # Port 4000
cd thinker && npm start      # Port 4001
npm run dev                  # Vault (Vite)
npm run electron:dev         # Electron app

# Clear Electron cache (fixes sync issues)
.\clean_electron_cache.bat
```

---

## 🧠 Current Focus

*Check `task.md` in the brain folder for active tasks*

---

## ⚠️ Things to Remember

<coding_guidelines>
- Satellite is JavaScript (not TypeScript yet)
- Vault uses IndexedDB for storage
- Scout uses SQLite at `satellite/intelligence.db`
- Telegram config is in Scout's `notification_config` table
- Daily Brief runs at 07:00 via BriefScheduler
- Price lookup: Scout DB → External APIs (Scout-first)
</coding_guidelines>

---

## 📋 Workflows

| Command | Purpose |
|---------|---------|
| `/document-session` | Create session summary |
| `/audit-portfolio-math` | Verify PnL calculations |
| `/fix-satellite-sync` | Debug Scout/Vault sync |

---

## 🧪 Unit Tests

**Run tests:** `npm run test -- --run`

| Service | Tests | Status |
|---------|-------|--------|
| AccountingService | 15 | ✅ Pass |
| TransactionProcessingService | 4 | ✅ Pass |
| PriceService | 15 | ✅ Pass |
| WatchlistServiceLogic | 9 | ✅ Pass |
| portfolioCalculator | 17 | ✅ Pass |

**Total: 60+ tests**

> **AI Rule:** After making code changes, always run tests and report results.

---

## 🤖 Agent Roles

Call specific agents when needed:
- **DEBUGGER** - Root cause analysis
- **FEATURE DEVELOPER** - Implementation
- **ARCHITECT** - Design decisions
- **CODE REVIEWER** - Quality check

*See `ROLES.md` for full list*

---

*Last updated: January 17, 2026*
