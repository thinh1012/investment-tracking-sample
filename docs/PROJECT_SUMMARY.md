# Project Summary: Personal Investment Tracker

## Overview
A comprehensive, privacy-focused dashboard for tracking crypto investments, Liquidity Pool (LP) positions, and funding sources. Built with React (Vite) and TailwindCSS, utilizing LocalStorage for zero-setup persistence.

## Key Features Implemented

### 1. Investment Tracking Core 💰
*   **Total Invested Calculation**: Aggregates cost basis from all "Deposit" transactions.
*   **Funding Breakdown**:
    *   **Consolidated Stablecoins**: Groups USDT, USDC, USD, DAI into a single "USD Stablecoins" bucket.
    *   **Additive Manual Override**: Allows setting a baseline (e.g., $13,580) for initial capital, with new "Fresh Capital" deposits automatically adding to this total.
    *   **Net Funding Logic**: Smartly handles "Holdings-to-LP" transfers to avoid double-counting them as fresh capital (Deposit + Linked Withdrawal = 0 Net).
*   **Audit History**: Expandable list showing every transaction contributing to the "Fresh Capital" sum.

### 2. Liquidity Pool (LP) Analytics 📊
*   **Active Position Tracking**: Monitors LP tokens, their value, and "In Range" status.
*   **Range Monitoring**:
    *   Visual indicators (Green/Red) for "In Range" vs "Out of Range".
    *   **Sorting**: Sort LPs by "Health" (Range Status) or Pool Name.
*   **Mixed Funding Support**: Capable of tracking LPs funded partially by Fresh Cash and partially by Existing Holdings (Split cost basis).

### 3. Smart Watchlist 👁️
*   **Target Tracking**: Set "Target Buy" and "Target Sell" prices.
*   **Investment Goals**: Track "Expected Quantity" vs "Actually Bought".
*   **Progress Visualization**: Visual bar showing % of position accumulation.
*   **Recommendations**: Automated "Buy/Sell/Hold" signals based on current price vs targets.

### 4. Transaction Management 📝
*   **Full CRUD**: Create, Read, Update, Delete transactions.
*   **Filtering & Sorting**: Sort by Date, Filter by Type (Deposit/Withdrawal/Interest).
*   **Search**: Real-time search by asset symbol.
*   **CoinGecko Integration**: Auto-fetches historical prices for simpler data entry.

### 5. Cloud Sync & Security ☁️
*   **Encrypted Vault**: End-to-end encryption for portfolio data using a private sync password.
*   **Supabase Integration**: Secure cloud storage for cross-device synchronization (Mobile/Desktop).
*   **Privacy-First**: No data is stored in plain text outside the local machine.

## Recent Technical Enhancements
*   **Architecture Map**: A visual diagram (`docs/ARCHITECTURE.md`) explaining the data flow and entity relationships.
*   **Self-Healing Logic**: Automated migration scripts to correct localized data issues (e.g., funding offset calibration).
*   **Interactive UI**: Clickable edit fields for key metrics (Manual Principal, Targets, Notes).

## Future Roadmap
*   **Server Deployment**: Dockerize for Proxmox/Home Server hosting.
*   **Secure Access**: Tailscale or Cloudflare Tunnel for remote viewing.
