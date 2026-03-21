# 📋 Task.md Maintenance Guide

## Rules to Keep task.md Clean

### 1. **Archive Completed Phases Weekly**
When all items in a phase are `[x]`, move them to `CHANGELOG.md`

### 2. **Maximum Size: 100 Lines**
If task.md exceeds ~100 lines, archive completed phases

### 3. **Task Format**
```markdown
## Phase X: [Name] [STATUS]
- [ ] Uncompleted
- [/] In progress  
- [x] Done
```

### 4. **Status Tags**
- No tag = In Progress
- `[DONE]` = Ready to archive
- `[BLOCKED]` = Waiting on something

---

## Archive Process

1. **Move completed phases** to `CHANGELOG.md`:
```markdown
## January 2026
### Phase 28: Electron Connectivity [COMPLETE]
- Fixed Supabase sync...
```

2. **Keep in task.md**:
   - Current uncompleted work
   - Recently completed (last 1-2 phases)
   - Code health/backlog items

---

## Recommended Structure

```markdown
# Current Tasks

## Active Work
- [/] Current task 1
- [ ] Next task

---

## Recently Completed (Archive Soon)
- [x] Phase 31: Scheduled Briefs [DONE]

---

## Backlog (Code Health)
- [ ] Split DataScoutService.ts
- [ ] Add unit tests
```
