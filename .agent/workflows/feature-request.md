---
description: How to request and implement new features with AI assistance
---

# Feature Development Workflow

Use this workflow when you want to add new functionality to Digital HQ.

---

## Step 1: Define the Feature Request

Provide the AI with:

**Required Information:**
- **What:** Clear description of the feature
- **Why:** Business value or problem it solves
- **Where:** Which service(s) it affects (Vault UI, Scout, Thinker, or multiple)
- **How:** Expected user flow or technical behavior

**Example:**
```
I want to add a Profit/Loss Chart to the Dashboard.

What: A line chart showing portfolio value over time
Why: Track performance trends visually
Where: Vault UI - Dashboard component
How: Chart updates when transactions are added, shows daily portfolio value
```

---

## Step 2: Architecture Review

Ask the AI:
```
"Use the ARCHITECT role to review this feature request and identify:
- Which services/files will be affected
- Potential risks or conflicts
- Data flow changes needed"
```

**AI Response:** Technical feasibility assessment + file impact list

---

## Step 3: Implementation Planning

Command:
```
"Create an implementation_plan.md with:
- Proposed file changes
- Database schema updates (if needed)
- API endpoint changes (if needed)
- Verification approach"
```

**AI Deliverable:** `brain/[conversation-id]/implementation_plan.md`

👉 **REVIEW THIS PLAN** before proceeding!

---

## Step 4: User Approval

**Review Checklist:**
- [ ] Does the plan match your intent?
- [ ] Are there breaking changes you need to know about?
- [ ] Do you understand the trade-offs?
- [ ] Is the scope acceptable (not too big)?

**If approved:** "Proceed with implementation"  
**If changes needed:** "Update the plan: [your feedback]"

---

## Step 5: Implementation

Command:
```
"Switch to FEATURE DEVELOPER role and implement the approved plan.
Update ARCHITECTURE.md and CONTEXT.md if needed."
```

**AI Actions:**
- Writes code across affected files
- Updates documentation
- Follows existing code patterns

---

## Step 6: Verification

### 6A. Prepare Test Environment

**AI Will Remind You:**
```
⚠️ TESTING REMINDER:
Before testing this feature, seed test data for realistic scenarios:

Run: npm run seed:clean && npm run dev

This will:
- Clear existing test data
- Populate realistic portfolio (90-day history)
- Start dev server with fresh data

Ready to proceed with manual testing?
```

// turbo
```powershell
npm run seed:clean
npm run dev
```

### 6B. Execute Tests

Command:
```
"Switch to TESTER role. Verify the feature works by:
- Testing the happy path
- Testing edge cases
- Checking for regressions"
```

**Manual Testing Checklist:**
- [ ] Feature works with seeded data
- [ ] Edge cases handled correctly
- [ ] No console errors
- [ ] UI responsive and smooth
- [ ] Works across different data scenarios

---

## Step 7: Documentation

Command:
```
"Switch to DOCUMENTATION WRITER role.
Document this feature in CHANGELOG.md and update README if user-facing."
```

---

## Step 8: Decision Recording

Command:
```
"Update DECISION_LEDGER.md with:
- What was implemented
- Why we chose this approach
- Any important edge cases to remember"
```

This prevents future AI sessions from breaking your logic!

---

## Quick Template

Copy-paste this to start:

```
I want to add [FEATURE_NAME].

What: [description]
Why: [business value]
Where: [Vault/Scout/Thinker/Multiple]
How: [expected behavior]

Use the ARCHITECT role to review this first, then create an implementation plan.
```
