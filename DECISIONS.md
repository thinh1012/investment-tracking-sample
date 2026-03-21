# 🧠 Decision Log

This log tracks important decisions made on the project. It helps AI assistants understand WHY choices were made, providing crucial context across sessions.

---

## How to Use

**When to log a decision:**
- Architecture choices (why X over Y?)
- Bug fix approaches (why this solution?)
- Feature design decisions
- Trade-offs made

**Format:**
```markdown
### [Date] - [Decision Title]
**Context**: What problem we were solving
**Decision**: What we chose
**Alternatives Considered**: What we didn't choose
**Rationale**: WHY this choice
```

---

## January 2026

### 2026-01-17 - Daily Brief: No LP in AI Analysis
**Context**: User wanted a shorter, more focused daily brief  
**Decision**: Remove LP position details from AI analysis prompt  
**Alternatives**: Keep LP but make it collapsible; separate LP report  
**Rationale**: User prefers actionable market insights over portfolio status in the brief

---

### 2026-01-17 - Scout-First Price Architecture
**Context**: PriceService was making many external API calls  
**Decision**: Check Scout database first before calling external APIs  
**Alternatives**: Cache all prices locally; use only external APIs  
**Rationale**: Scout already has fresh prices from missions; reduces API calls and latency

---

### 2026-01-16 - Scheduled Brief via Thinker→Scout→Telegram
**Context**: Daily brief needs to send to Telegram at 7:00 AM  
**Decision**: Thinker generates brief, posts to Scout's `/fidelity/telegram`, Scout sends to Telegram  
**Alternatives**: Thinker sends directly to Telegram; use separate notification service  
**Rationale**: Scout already has Telegram config in SQLite; reuse NotificationBridge

---

### Earlier - IndexedDB for Vault (Browser), SQLite for Scout (Node)
**Context**: Need persistent storage for both frontend and backend  
**Decision**: Use IndexedDB in Vault (browser-native), SQLite in Scout (Node.js)  
**Alternatives**: Single SQLite for everything (Electron only); use Supabase for all  
**Rationale**: IndexedDB works in browser+Electron; SQLite is faster for Node batch ops

---

*Update this log when making significant decisions*
