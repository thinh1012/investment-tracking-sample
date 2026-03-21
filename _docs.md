# Investment Tracking — Digital HQ

## Overview
- **What it does:** Crypto portfolio tracker with price scraping and AI analysis. Three services: Vault (UI), Satellite Scout (price scraper), The Thinker (AI analysis).
- **Status:** WIP — Satellite and Thinker are being retired. Vault is the active focus.

---

## Tech Stack
- **Vault (frontend):** React 19, TypeScript, Vite, Tailwind CSS, IndexedDB (`idb`), Recharts, Supabase (cloud sync)
- **Satellite Scout:** Node.js, Express, Puppeteer, better-sqlite3 — port `4000`
- **The Thinker:** Node.js, Express, Google Gemini AI — port `4001`
- **Desktop:** Electron 34 wrapper

---

## Project Structure
```
investment-tracking/
├── src/                    # Vault React app
├── satellite/              # Scout price scraper service
│   ├── server.js
│   └── presets.json
├── thinker/                # AI analysis service (being retired)
│   ├── server.js
│   └── ecosystem.config.js
├── electron/               # Desktop wrapper
├── .env                    # Supabase + Scout URL config
├── CLAUDE.md               # Project-specific AI instructions
├── ARCHITECTURE.md         # Full system design
├── QUICKSTART.md           # How to run locally
└── README.md
```

---

## Ports
| Service | Port |
|---|---|
| Vault (Vite dev) | 5174 |
| Satellite Scout | 4000 |
| The Thinker | 4001 |

---

## How to Run
```bash
npm run dev              # Vault UI on port 5174
npm run start-satellite  # Scout on port 4000
npm run start-thinker    # Thinker on port 4001
npm run build            # TypeScript + Vite build
npm run test             # Vitest unit tests
```

---

## Environment Variables (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SCOUT_URL=http://192.168.1.131:4000
```

---

## Deployment
- Server path: `/root/services/` (thinker has PM2 config at `thinker/ecosystem.config.js`)
- Satellite and Thinker are being retired — no new work on these

---

## Known Issues / Bugs
- Search bar in RecentTransactions had filter issues (debug line added showing term + count)
- Playwright MCP configured but requires session restart to activate

---

## Further Reading
- `CLAUDE.md` — project-specific AI rules and common commands
- `ARCHITECTURE.md` — full data flow and system design
- `QUICKSTART.md` — local setup and troubleshooting
