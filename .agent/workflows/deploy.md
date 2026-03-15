---
description: how to deploy changes to GitHub and Tencent Cloud server after completing work
---

# Deploy to GitHub + Tencent Cloud

After finishing all code changes and passing `next build`, run these steps:

// turbo-all

1. Check uncommitted changes:
   ```
   git -C /Users/ztq0412/Documents/Playground status --short
   ```

2. Stage all modified files:
   ```
   git -C /Users/ztq0412/Documents/Playground add <files>
   ```

3. Commit with a descriptive message:
   ```
   git -C /Users/ztq0412/Documents/Playground commit -m "<type>: <description>"
   ```

4. Push to main:
   ```
   git -C /Users/ztq0412/Documents/Playground push origin main
   ```

5. Wait 10s then check GitHub Actions run status:
   ```
   sleep 10 && curl --max-time 20 -s 'https://api.github.com/repos/Tahoe0412/Tahoe-Agent/actions/runs?per_page=1&branch=main' | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['workflow_runs'][0]; print(f'Run #{r[\"run_number\"]} | Status: {r[\"status\"]} | Conclusion: {r.get(\"conclusion\",\"pending\")} | ID: {r[\"id\"]}')"
   ```

6. Monitor until deploy finishes (check every 30-50s). Get job status details:
   ```
   curl --max-time 20 -s 'https://api.github.com/repos/Tahoe0412/Tahoe-Agent/actions/runs/<RUN_ID>/jobs' | python3 -c "
   import sys,json
   d=json.load(sys.stdin)
   for j in d['jobs']:
     print(f'Job: {j[\"name\"]} | Status: {j[\"status\"]} | Conclusion: {j.get(\"conclusion\",\"pending\")}')
     for s in j['steps']:
       print(f'  Step {s[\"number\"]}: {s[\"name\"]} | Status: {s[\"status\"]} | Conclusion: {s.get(\"conclusion\",\"pending\")}')
   "
   ```

7. Once deploy completes, verify server health:
   ```
   curl --max-time 15 -s -o /dev/null -w "HTTP %{http_code} | Time: %{time_total}s" http://111.229.24.208/api/health
   ```

8. Verify the settings page responds:
   ```
   curl --max-time 15 -s http://111.229.24.208/settings -o /dev/null -w "HTTP %{http_code} | Size: %{size_download}B | Time: %{time_total}s"
   ```

9. If any step fails:
   - **Build fails**: Check the error, fix the code, re-commit + push
   - **Deploy SSH fails**: Check the GitHub Actions logs for the failing step
   - **Health check fails**: Wait 30s and retry — the server may still be restarting
   - **HTTP errors**: Check if it's a DB issue vs code issue
