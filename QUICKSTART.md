# 🚀 Quick Start Guide - Digital HQ

> **TL;DR**: Use Chrome at `localhost:5174` for best experience. Electron has Cloud Sync issues.

## Starting the Application

### Option 1: Chrome (Recommended ✅)

**Step 1 - Start Vite:**
```powershell
cd C:\Users\ducth\.gemini\antigravity\scratch\investment-tracking
npm run dev
```
✅ Wait for: `VITE ready at http://localhost:5174`

**Step 2 - Start Scout (Price Scraper):**
```powershell
# New terminal
npm run start-satellite
```
✅ Scout runs on `http://localhost:4000`

**Step 3 - Open Chrome:**
- Navigate to: `http://localhost:5174`
- Bookmark this URL for easy access

**✅ You now have:**
- Full Vault UI with all features
- Scout price integration
- Telegram notifications
- **Cloud Vault sync (works perfectly in Chrome!)**

---

### Option 2: Electron Desktop (Advanced ⚠️)

**Known Issues:**
- Cloud Vault restore doesn't work (Vite CSP headers block Supabase)
- Service Worker fails to register

**If you still want to use it:**

```powershell
# Terminal 1: Vite (keep this running!)
npm run dev

# Terminal 2: Electron
npm run start-desktop
```

**Workaround for Cloud Sync:**
1. Use Chrome to restore from Cloud Vault
2. Export to JSON snapshot
3. Import that JSON in Electron

---

## Importing Your Data

### From JSON Backup File

1. **Settings** (⚙️) → **Backup & Recovery**
2. Click **Import Snapshot**
3. Select your backup file (e.g., `alpha_vault_full_backup_2026-01-11.json`)
4. Wait for success message
5. Page auto-reloads
6. Data appears in Dashboard!

**Supported Formats:**
- ✅ Legacy: `{ version, date, transactions: [...] }`
- ✅ New: `{ metadata: {...}, transactions: [...], assets: [...] }`

### From Cloud Vault (Chrome only!)

1. **Settings** → **Cloud Vault** tab
2. Sign in with Google (ducthinh1012@gmail.com)
3. Enter sync password: `Settlewa98102!`
4. Click **Restore Data**
5. Your data syncs from Supabase

---

## Services Architecture

| Service | Port | Auto-starts with | Purpose |
|:---|:---|:---|:---|
| **Vite Dev Server** | 5174 | `npm run dev` | The Vault UI |
| **Scout Satellite** | 4000 | `npm run start-satellite` | Price scraper |
| **Thinker AI** | 4001 | `npm run start-thinker` | AI analysis (optional) |

**All services communicate via HTTP APIs** - Chrome and Electron both connect to the same Scout/Thinker servers.

---

## Storage Locations

### IndexedDB (Primary)
- **Database:** `investment-tracker`
- **Stores:** `transactions`, `assets`, `notes`
- **Location:** Browser-specific (Chrome and Electron have separate databases)

### LocalStorage (Legacy/Backup)
- Settings, themes, preferences
- Not used for transactions anymore

### Supabase (Cloud Backup)
- **Table:** `public.user_vaults`
- **Encryption:** AES-256 with user password
- **Access:** Chrome only (CSP issues in Electron)

---

## Troubleshooting

### "No transactions" after import
- **Check:** Application tab → IndexedDB → investment-tracker → transactions
- **Fix:** Refresh page (F5) to reload React state

### Scout prices not updating
- **Check:** Is `npm run start-satellite` running?
- **Test:** Visit `http://localhost:4000/intel/vault` - should show price data
- **Fix:** Restart Scout: Ctrl+C, then `npm run start-satellite`

### Cloud Vault "Connection timeout" in Electron
- **Known Issue:** Vite CSP blocks Supabase
- **Fix:** Use Chrome for Cloud Vault, or import via JSON snapshot

---

## Daily Workflow

**Morning:**
```powershell
# Terminal 1
npm run dev

# Terminal 2
npm run start-satellite
```

**Then:**
- Open Chrome → `localhost:5174`
- Scout auto-fetches prices every 6 hours
- Telegram alerts work automatically
- Cloud auto-sync every 30 minutes (if signed in)

**Evening:**
- Just close Chrome (services keep running)
- Or Ctrl+C both terminals to stop everything

---

**Last Updated:** 2026-01-14 (Phase 24 - Cloud Vault & Electron Debugging)
