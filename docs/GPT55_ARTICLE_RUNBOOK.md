# GPT5.5 Article Production Runbook

> Last updated: 2026-04-24 by Codex

## Final Inspection Entry

- **Final project ID**: `cmocc5cfq0034s0v59k0ot713`
- **Cloud inspection project ID**: `cmocgo05k0000v6w47xyxcr39`
- **Local article workspace**: `http://localhost:3000/script-lab?projectId=cmocc5cfq0034s0v59k0ot713`
- **Local image brief workspace**: `http://localhost:3000/scene-planner?projectId=cmocc5cfq0034s0v59k0ot713`
- **Local image task workspace**: `http://localhost:3000/render-lab?projectId=cmocc5cfq0034s0v59k0ot713`
- **Cloud article workspace after deploy**: `http://111.229.24.208/script-lab?projectId=cmocgo05k0000v6w47xyxcr39`
- **Cloud image brief workspace after deploy**: `http://111.229.24.208/scene-planner?projectId=cmocgo05k0000v6w47xyxcr39`
- **Cloud image task workspace after deploy**: `http://111.229.24.208/render-lab?projectId=cmocgo05k0000v6w47xyxcr39`

## Final Article Package

- **Account**: AI快讯
- **Topic**: GPT5.5发布后，普通用户最能直接感知到什么
- **Primary title candidate**: GPT-5.5 没急着秀肌肉，而是先把账单打下来了。
- **Publish lead**: OpenAI 凌晨悄悄更新，GPT-5.5 来了。除了程序员狂喜，我们普通人最直接的感受是什么？
- **Final merged script version**: version `2` copied into project `cmocc5cfq0034s0v59k0ot713`
- **Merged-from project**: `cmocd8dug004rs0v5dn16snhu`
- **Cloud reconstruction note**: the cloud server uses a separate database, so the same package was rebuilt there through Tahoe APIs under project `cmocgo05k0000v6w47xyxcr39`.

## Tahoe Production Process Used

1. **Signal intake**
   - Entered from `Daily Run / 每日运行台`.
   - Queried GPT5.5 / OpenAI model update related terms through Tahoe's Serper-backed hot-topics route.
   - Confirmed the search path was live news mode, not mock mode.

2. **Draft start**
   - Routed the selected signal into the `AI快讯` lane.
   - Used the existing `generate-from-news` owned-media path with `contentLine = MARS_CITIZEN` and `outputType = NARRATIVE_SCRIPT`.
   - Created several trial projects while finding the strongest angle; only the final full-chain project is now kept visible.

3. **Main draft review**
   - Used Script Lab's persisted `audience_panel_review`.
   - The best draft was the one focused on user-visible changes: lower cost / faster response, stronger code and math ability, and more concise answers.
   - The final project now carries that best draft as its latest script version.

4. **Packaging**
   - Generated multiple title-pack versions and publish-copy versions in Script Lab.
   - The strongest title direction was the "账单先降下来" angle because it gives GPT5.5 a concrete reader-facing hook instead of repeating model-release language.
   - A publish-copy version is already marked `READY` and includes lead, highlights, and CTA.

5. **Image brief planning**
   - Scene Planner produced five image rows.
   - The publication package should use the first three as the initial article-image set:
     - Cover: `GPT-5.5 重磅发布`
     - Body image 1: `核心变化一：成本与效率`
     - Body image 2: `核心变化二：专业能力提升`

6. **Image task feedback**
   - Render Lab has three queued image tasks with saved result feedback.
   - Cover verdict: `KEEP`
   - Cost/efficiency image verdict: `RETRY`
   - Professional capability image verdict: `REWRITE_BRIEF`
   - Current boundary: Tahoe records image briefs and image-job feedback, but does not yet call a real automatic image executor.

## Three Image Briefs

### 1. Cover: GPT-5.5 重磅发布

Goal: communicate GPT5.5 launch, availability, and AI upgrade at first glance.

Brief: dark futuristic background, flowing digital data streams, OpenAI logo glowing in teal, morphing into bold `GPT-5.5` text, then pushing into a clean ChatGPT Plus style interface showing the GPT5.5 option.

Current judgment: keep this direction; it is ready to hand to an image executor, with a note to add more concrete screen UI detail.

### 2. Body Image: 核心变化一：成本与效率

Goal: explain lower token consumption and faster response through one simple information graphic.

Brief: clean 3D bar chart comparing `GPT-4` and `GPT-5.5`; GPT5.5 bar shrinks to show reduced token consumption; add gold coin with downward arrow and fast clock icon.

Current judgment: retry this direction; visual logic is right, but the left/right hierarchy needs to be stronger.

### 3. Body Image: 核心变化二：专业能力提升

Goal: show better code/math capability as a concrete professional-use scenario.

Brief: dark-mode code editor, red syntax error, AI cursor rewrites the wrong code, green checkmark appears, shallow depth of field, screen-lit cinematic mood.

Current judgment: revise the brief before another image run; add more realistic interface elements and a clearer math/code proof point.

## Duplicate Project Cleanup

Cleanup policy: archive, do not hard delete.

Kept final project:

- `cmocc5cfq0034s0v59k0ot713`

Cloud inspection copy:

- `cmocgo05k0000v6w47xyxcr39`

Archived duplicate dry-run projects:

- `cmocd8dug004rs0v5dn16snhu`
- `cmoccq6ak004is0v59l4eg58n`
- `cmocbydru002ss0v5gqlkl0eo`
- `cmocbwmqn002ps0v5yzvc22hq`
- `cmocbut2z002ms0v5c2tugfhg`
- `cmocagc9y000ws0v5mrg22200`
- `cmocabjhb000os0v5ggn56n89`
- `cmoca76km000hs0v5rxy2xquf`
- `cmoca074o0009s0v5iiajcvp4`
- `cmoc9mji20000s0v5bdyr0whu`

Each archived project is marked with:

- `cleanup_reason = gpt55_dry_run_duplicate`
- `cleanup_kept_project_id = cmocc5cfq0034s0v59k0ot713`

## What Blocked The Flow

- The local screenshot error on `/daily-run` matched a stale dev webpack/HMR cache pattern. Production build already passed. A clean `.next` reset plus fresh dev server returned `/daily-run` as `200`.
- Lint was blocked by unrelated non-Tahoe analysis/econometrics files. ESLint now ignores those directories and still reports Tahoe code warnings.
- The project list was too noisy after dry-run experiments. Default read models now hide archived projects, while Settings can still include and restore archived records.
- The final script and final image-task records originally lived in separate projects. The best script is now merged back into the full-chain project so there is one inspection entry.

## Next Improvements

- Persist Daily Run signal triage instead of keeping kept/dismissed signals in browser session state.
- Add a dedicated "final package" panel that shows final title, lead, article, image briefs, and image job status on one page.
- Connect the image executor once the brief + feedback loop is stable enough to avoid wasting image-generation budget.
