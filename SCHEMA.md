# 🗄️ Database & Storage Schema

This document outlines the data structures used by the **Investment Tracking Vault**. The system uses a hybrid storage model: **SQLite** for high-density intelligence and **IndexedDB** for portfolio persistence.

---

## 🏛️ SQL Storage (SQLite)
**File**: `intelligence.db` (Located in AppData/UserData folder)
**Purpose**: High-density scraping, historical intelligence, and strategist analytics.

### Table: `strategist_intel`
Primary store for ecosystem research and daily briefs.

| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | **TEXT (PK)** | The asset ticker (e.g., "HYPE", "SUI"). |
| `metrics` | **TEXT (JSON)** | Stringified object containing volume, TVL, and other varying stats. |
| `verdict` | **TEXT** | The strategist's narrative analysis. |
| `rating` | **TEXT** | Tactical rating (e.g., "STRONG BUY", "GOOD"). |
| `updatedAt` | **INTEGER** | Unix timestamp of the last scrape. |

---

## 🔱 Browser Storage (IndexedDB)
**Database**: `crypto-investment-db`
**Purpose**: Fast, local-first portfolio management and user settings.

### Store: `transactions`
The source of truth for all PnL and history.
*   **KeyPath**: `id` (UUID)
*   **Indexes**: `date`, `symbol`, `type`

### Store: `watchlist`
Tracked assets and accumulation targets.
*   **KeyPath**: `symbol`
*   **Fields**: `targetBuy`, `targetSell`, `accumulationGoal`, `notes`.

### Store: `market_picks`
AI-generated entry/exit probabilities.
*   **KeyPath**: `symbol`

### Store: `manual_prices` & `asset_overrides`
User-defined overrides for price feeds and cost basis.
*   **KeyPath**: `symbol`

### Store: `historical_prices`
Cache for chart data.
*   **KeyPath**: `[symbol, date]` (Compound Key)

---

## 🔐 Data Lifecycle
1.  **Ingestion**: Scraped data (Browser Subagent) -> IPC Bridge -> **SQLite**.
2.  **Persistence**: Transactions (Forms) -> **IndexedDB**.
3.  **Sync**: Local Data -> E2EE Encryption -> **Cloud Vault (Supabase)**.
