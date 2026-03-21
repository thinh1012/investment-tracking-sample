---
description: How to debug issues with AI assistance
---

# Debug Issue Workflow

Use this workflow when something is broken or not working as expected.

---

## Step 1: Describe the Problem

Provide the AI with:

**Required Information:**
- **What's broken:** Specific symptom (e.g., "Transactions not saving", "Scout not scraping HYPE price")
- **Expected behavior:** What should happen
- **Actual behavior:** What's actually happening
- **When it started:** Did this ever work? Recent changes?
- **Error messages:** Copy-paste any console errors, stack traces, or logs

**Example:**
```
Problem: Scout is not scraping HYPE price anymore.

Expected: HYPE_PRICE should update every 6 hours in Scout missions
Actual: Last successful scrape was 2 days ago, now shows "null"
When: Started yesterday after I updated presets.json
Error: Console shows "Selector not found: .price-value"
```

---

## Step 2: Gather Evidence

Command:
```
"Use the DEBUGGER role to investigate. 
Start by checking:
1. Recent file changes (git diff)
2. Console/terminal logs
3. Network requests (if UI issue)
4. Database state (if data issue)"
```

**AI Actions:** Analyzes relevant files and identifies potential root causes

---

## Step 3: Reproduce the Issue

**AI will ask you to:**
- Provide screenshots (if UI bug)
- Share terminal output
- Confirm specific steps to reproduce

**Example:**
```
"The Debugger needs more info. Please:
1. Open DevTools Console (F12)
2. Try adding a transaction
3. Copy-paste any red error messages"
```

---

## Step 4: Hypothesis Formation

**AI Response Format:**
```
Root Cause Hypothesis:
- Primary: [most likely cause]
- Secondary: [alternative explanation]
- Tertiary: [edge case possibility]

Recommended Investigation:
1. [specific file to check]
2. [specific value to inspect]
```

**You validate:** Confirm which hypothesis makes sense based on your changes

---

## Step 5: Fix Implementation

Command:
```
"Implement the fix for [PRIMARY HYPOTHESIS].
If that doesn't work, we'll try the secondary hypothesis."
```

**AI Actions:**
- Makes targeted code changes
- Explains what was wrong and why

---

## Step 6: Verification

**AI Will Remind You:**
```
⚠️ TESTING REMINDER:
To verify the fix, start with clean test data:

Run: npm run seed:clean && npm run dev

This ensures you're testing against a known-good baseline.
```

// turbo
```powershell
# Seed fresh test data first (recommended)
npm run seed:clean

# Then start relevant service
# If Vault issue
npm run dev

# If Scout issue  
cd satellite
npm start

# If Thinker issue
cd thinker
npm start
```

**Manual Test:** Reproduce the original problem to confirm it's fixed

---

## Step 7: Prevention

Command:
```
"Update DECISION_LEDGER.md with:
- What broke
- Root cause
- How to prevent this in the future"
```

**Example Entry:**
```markdown
## 2026-01-18: Scout HYPE Selector Broke

**Issue:** CoinMarketCap changed their HTML structure
**Root Cause:** `.price-value` selector no longer exists, now `.text-cdp-price-display`
**Fix:** Updated presets.json selector
**Prevention:** Add fallback selectors to all Scout missions
```

---

## Common Debug Paths

### UI Component Not Rendering
1. Check browser console for errors
2. Verify component import paths
3. Check if data is loading (React DevTools)
4. Inspect CSS (display: none, z-index issues)

### Scout Mission Failing
1. Check `satellite/server.js` logs
2. Test URL manually in browser
3. Verify selector still exists (CMC/TradingView change HTML often)
4. Check `scout_intelligence.db` for error logs

### Cloud Sync Not Working
1. Check Supabase dashboard (is project paused?)
2. Verify `.env` has correct credentials
3. Check browser console for network errors
4. Confirm RLS policies are correct

### Thinker Not Responding
1. Check `thinker/server.js` logs
2. Verify Gemini API key is valid
3. Check rate limits (1500 requests/day free tier)
4. Test API endpoint with curl/Postman

---

## Quick Template

Copy-paste this to start debugging:

```
I have a bug:

What's broken: [symptom]
Expected: [what should happen]
Actual: [what's happening]
Error message: [paste error]

Use the DEBUGGER role to investigate and propose fixes.
```
