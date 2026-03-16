---
description: Instructions for any AI agent starting work on Tahoe project
---

# Agent Onboarding

## Before Writing Any Code

1. Read the project context files in this order:
   - `docs/PROJECT_STATE.md` — current status, stack, constraints
   - `docs/TASKS.md` — task tracker with IDs
   - `docs/DECISIONS.md` — key decisions you must not violate
   - `docs/WORKLOG.md` — recent handoff records

2. Summarize your understanding:
   - Current project status
   - The specific task you will work on (use task ID)
   - Constraints you must not violate
   - Your implementation plan

3. Only then start coding.

## While Working

- Work on ONE task at a time, referenced by task ID (e.g. T-004)
- Do NOT make unrelated changes ("顺手优化")
- Do NOT refactor files outside the task scope
- Do NOT change the design system or CSS approach
- Commit frequently with task ID in the message: `git commit -m "T-004 add YouTube API key config"`

## Before Finishing

// turbo-all

1. Update `docs/TASKS.md`:
   - Move completed tasks to Done with commit hash
   - Update in-progress tasks

2. Update `docs/DECISIONS.md` if any architectural/product decision was made

3. Append a concise handoff entry to `docs/WORKLOG.md`:
   ```
   ## YYYY-MM-DD HH:MM — Agent: [agent name]
   ### Task: [task ID and title]
   **Commit**: `hash`
   **Changes**: [files changed and why]
   **Remaining**: [what's left]
   **Next Agent**: [what to look at first]
   ```

4. Update `docs/PROJECT_STATE.md` if module status changed

5. Commit docs changes: `git commit -m "docs: update project context after T-XXX"`

## Deploy Workflow

After pushing to `main`, CI/CD auto-deploys. If it fails, manual deploy:

```bash
cd /home/ubuntu/Tahoe-Agent && git reset --hard origin/main && rm -rf .next && npm run build && pm2 restart tahoe --update-env
```

Always verify after deploy:
```bash
curl -s http://111.229.24.208/ -o /dev/null -w 'HTTP %{http_code}\n'
```
