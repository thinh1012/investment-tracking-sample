# 🏆 Holy Grail: Working with AI Agents

This guide explains how to effectively work with AI assistants on this project.

---

## 📚 Key Documents (Priority Order)

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| **CONTEXT.md** | Project overview for new AI sessions | Weekly or after major changes |
| **task.md** | Current work checklist | Every session |
| **ROLES.md** | Agent personas (Debugger, Developer, etc.) | Rarely |
| **ARCHITECTURE.md** | System design reference | After major refactors |

---

## 🚀 Starting a New Session

**Tell the AI:**
```
Read CONTEXT.md and task.md to understand the project state.
```

Or use the quick start:
```
/document-session  (at session end)
```

---

## 📋 What to Update Daily

### 1. **task.md** - Your Work Tracker
```markdown
- [ ] Uncompleted task
- [/] In progress
- [x] Done
```
Update this as you work. AI agents will read this to know your current focus.

### 2. **Session Summaries**
At end of session, ask:
```
/document-session
```
This creates a dated summary file.

---

## 🎯 Effective Commands

### Request Specific Agents
```
"I need the DEBUGGER to investigate why prices aren't loading"
"Call the ARCHITECT to review this design"
"Use FEATURE DEVELOPER mode to implement this"
```

### Task-Based Commands
```
"Fix the bug where..."          → Auto-selects DEBUGGER
"Add a new feature that..."     → Auto-selects FEATURE DEVELOPER
"Explain how ... works"         → Auto-selects TEACHER
"Review my code for..."         → Auto-selects CODE REVIEWER
```

### Quick Actions
```
/document-session     → Document what we did
/audit-portfolio-math → Check PnL calculations
/fix-satellite-sync   → Debug Scout/Vault sync
```

---

## 📂 Project Knowledge Files

| File | Location | Purpose |
|------|----------|---------|
| `CONTEXT.md` | Root | AI onboarding |
| `ARCHITECTURE.md` | Root | System design |
| `ROLES.md` | Root | Agent definitions |
| `.agent/workflows/*.md` | .agent/ | Reusable workflows |
| `task.md` | Brain folder | Session tasks |

---

## 💡 Pro Tips

1. **Be Specific**: "Fix the BTC Dominance bug" > "Fix the bug"
2. **Provide Context**: Include error messages, file names
3. **Request Agent**: "Use DEBUGGER mode" for focused help
4. **Update task.md**: Mark items done so AI knows progress
5. **End with /document-session**: Preserve session knowledge

---

## 🔄 Session Workflow

```
1. Start Session
   └─> "Read CONTEXT.md and task.md"

2. Work on Tasks
   └─> Request specific agents as needed
   └─> Update task.md as you go

3. End Session
   └─> "/document-session"
   └─> Save session summary
```

---

*This guide is your quick reference. Keep it in CONTEXT.md or as a separate file.*
