# 🧭 Project Navigation Guide

This document is the **Master Portal** for the Digital HQ. It serves as the absolute technical anchor and structural map for the ecosystem.

---

## 📜 Source of Truth
- **Name**: The Digital HQ (Investment Management Ecosystem)
- **Monorepo Structure**: Core Vault (React), Satellite Scout (Node), Thinker (Node/AI).
- **Environment**: Bundled **Portable Node.js (v22)** for background service isolation.
- **Persistence**: IndexedDB (Portfolio) + SQLite (Ecosystem Intel) + LocalStorage (Preferences).
- **Security**: Local-first. AES-256 encrypted Cloud Sync (Supabase). **Zero-Hardcode Policy**.

---

## 🗺️ Project Structure

```
/ (Root)
├── README.md (General overview & setup instructions)
├── README_AGENT.md (Master directive for AI Agents - PROJECT DNA & RULES)
├── ARCHITECTURE.md (High-level system design and component map)
├── CORE_LOGIC_FLOW.md (Data flow, Logic Pillars, and SQL Schema Guide)
├── NAVIGATION.md (THIS FILE - Master Portal & Source of Truth)
├── DECISION_LEDGER.md (Forensic record of past bugs and established logic)
├── PROJECT_MEMENTO.md (Long-term state and project DNA)
├── .agent/
│   └── workflows/ (Operational "Playbooks" for frequent tasks)
├── src/ (THE VAULT - Core Portfolio Management & Accounting)
├── satellite/ (THE SCOUT - Data Harvesting Intelligence Layer)
├── thinker/ (THE THINKER - AI Deliberation & Research)
├── electron/ (Desktop wrapper and portable node orchestration)
└── ops-console/ (Internal operational tools)
```

---
> [!TIP]
> **Active Memory**: Start with **`README_AGENT.md`** for rules and roles.
> **Logic Engine**: See **`CORE_LOGIC_FLOW.md`** for math, flow, and SQL queries.
> **History**: Use **`DECISION_LEDGER.md`** to avoid repeating past mistakes.
