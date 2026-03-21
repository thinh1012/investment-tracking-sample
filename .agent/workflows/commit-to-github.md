---
description: How to prepare and commit code to GitHub with AI assistance
---

# Commit to GitHub Workflow

Use this workflow to safely commit your work to version control.

---

## ⚠️ CRITICAL RULES

**AI agents MUST NEVER:**
- Run `git commit` automatically
- Run `git push` automatically  
- Modify git history without explicit permission

**You (the user) control all git operations!**

---

## Step 1: Review What Changed

// turbo
```powershell
git status
```

**AI can help interpret:**
```
"List the files I've changed and explain what each modification does"
```

**AI Response:** Summary of each changed file's purpose

---

## Step 2: Code Review

Command:
```
"Use the CODE REVIEWER role to review my uncommitted changes.
Check for:
- Code quality issues
- Security vulnerabilities (secrets, API keys)
- Missing error handling
- TODO comments that should be addressed"
```

**AI Actions:** Reviews `git diff` and provides feedback

**Critical Checks:**
- [ ] No hardcoded API keys or passwords
- [ ] No console.log() left in production code (unless intentional)
- [ ] No commented-out code blocks
- [ ] All new functions have comments explaining "why" not "what"

---

## Step 3: Pre-Commit Cleanup

**AI can help with:**

### Remove Debug Code
```
"Find and remove any console.log() statements I added for debugging"
```

### Format Code
```
"Format all changed files according to our code style (2-space indent, semicolons)"
```

### Add Missing Comments
```
"Add JSDoc comments to any new functions in [filename]"
```

---

## Step 4: Generate Commit Message

Command:
```
"Generate a commit message for my changes following this format:

Title: <type>: <short description> (50 chars max)
Body: Detailed explanation of what and why

Types: feat, fix, refactor, docs, test, chore"
```

**AI Response Example:**
```
feat: Add portfolio allocation pie chart to Dashboard

- Created AllocationChart.tsx component using Recharts
- Integrated with existing portfolio calculations
- Added color-coded legend for asset categories
- Chart updates reactively when transactions change

Files modified:
- src/components/Dashboard/AllocationChart.tsx (new)
- src/components/Dashboard/Dashboard.tsx
- src/hooks/useDashboardCalculations.ts

Closes #42
```

---

## Step 5: Stage Changes

**You run manually:**
```powershell
# Stage specific files
git add src/components/Dashboard/AllocationChart.tsx
git add src/components/Dashboard/Dashboard.tsx

# Or stage all
git add .
```

**Double-check staged files:**
```powershell
git status
```

---

## Step 6: Commit

**You run manually:**
```powershell
git commit -m "feat: Add portfolio allocation pie chart to Dashboard

- Created AllocationChart.tsx component using Recharts
- Integrated with existing portfolio calculations
- Chart updates reactively when transactions change"
```

**Verify commit:**
```powershell
git log -1 --oneline
```

---

## Step 7: Pre-Push Checklist

Before pushing to GitHub:

- [ ] App runs without errors (`npm run dev`)
- [ ] No secrets committed (double-check `.env` is gitignored)
- [ ] Tests pass (if you have any)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md updated (if user-facing change)

---

## Step 8: Push to GitHub

**You run manually:**
```powershell
# Push to current branch
git push

# Push to specific branch
git push origin feature/allocation-chart

# Force push (DANGEROUS - only if you know what you're doing)
git push --force
```

---

## Step 9: Post-Commit Documentation

Command:
```
"Update PROJECT_MEMENTO.md to reflect that this feature is now in the main branch"
```

**AI Actions:** Updates long-term project state

---

## Common Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: Add Thinker dashboard` |
| `fix` | Bug fix | `fix: Scout selector for HYPE price` |
| `refactor` | Code improvement (no behavior change) | `refactor: Extract price logic to service` |
| `docs` | Documentation only | `docs: Update ARCHITECTURE.md with Thinker` |
| `test` | Add or update tests | `test: Add portfolio calculator tests` |
| `chore` | Maintenance (dependencies, etc.) | `chore: Update React to 18.3` |
| `style` | Formatting, no code change | `style: Fix indentation in Dashboard` |
| `perf` | Performance improvement | `perf: Memoize heavy calculations` |

---

## Branch Strategy (Recommended)

**Main Branch Protection:**
```
main         (production-ready code)
  ↑
develop      (active development)
  ↑
feature/*    (new features)
bugfix/*     (bug fixes)
```

**Workflow:**
1. Create feature branch: `git checkout -b feature/allocation-chart`
2. Work and commit to feature branch
3. When ready, merge to `develop`: `git checkout develop && git merge feature/allocation-chart`
4. Test thoroughly on `develop`
5. Merge to `main` when stable: `git checkout main && git merge develop`

---

## Emergency: Undo Last Commit

**If you committed something wrong:**

```powershell
# Undo commit but keep changes (NOT PUSHED YET)
git reset --soft HEAD~1

# Undo commit and discard changes (DANGEROUS)
git reset --hard HEAD~1

# Already pushed? Revert instead
git revert HEAD
git push
```

⚠️ **Ask AI before running these commands if unsure!**

---

## AI-Assisted Commit Template

Copy-paste this workflow:

```
I'm ready to commit my changes.

1. CODE REVIEWER: Review my uncommitted changes for quality and security
2. After review, generate a commit message using conventional commit format
3. Remind me to run the pre-push checklist before pushing to GitHub

Do NOT run git commands yourself - I will run them manually.
```

---

## GitHub-Specific Tips

### Creating a Pull Request

After pushing your branch:
```
"Draft a GitHub Pull Request description for my feature branch.
Include:
- Summary of changes
- Testing checklist
- Screenshots (if UI change)
- Breaking changes (if any)"
```

### Reviewing PRs
```
"Review this Pull Request diff and check for:
- Security issues
- Code quality
- Potential bugs"
```

---

## Quick Reference

**Safe AI Commands:**
- ✅ Review my code
- ✅ Generate commit message
- ✅ Find files that changed
- ✅ Suggest what to commit together

**User Must Run:**
- ❌ git add
- ❌ git commit  
- ❌ git push
- ❌ git revert/reset

**Remember:** You control the git history. AI helps prepare, but never executes.
