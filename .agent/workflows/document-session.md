---
description: Document all work done in the current session
---

# Document Session Workflow

This workflow creates a comprehensive session summary document.

## Steps

1. **Scan recent file changes** - Check git status or recent modifications
2. **Review task.md** - See what tasks were marked complete
3. **Create session summary** - Generate `SESSION_SUMMARY_<date>.md` with:
   - Issues fixed (with root cause and solution)
   - Enhancements made
   - Files modified
   - Remaining tasks

## How to Trigger

At the end of any session, type:
```
/document-session
```

## Template Output

The Documentation Writer agent will create a file like:

```markdown
# 📋 Session Summary - [DATE]

## 🔧 Issues Fixed
- [Issue 1]: Root cause → Fix applied

## ✨ Enhancements Made
- [Enhancement 1]: Description

## 📁 Files Modified
| File | Changes |
|------|---------|
| path/to/file | What changed |

## 📋 Remaining Tasks
- [ ] Task 1
- [ ] Task 2
```

// turbo-all
