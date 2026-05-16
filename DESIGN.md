# Tahoe DESIGN.md

## Design Reference

Tahoe uses a local design direction derived from the `awesome-design-md` / `getdesign.md` idea of putting a plain-text design system in the project root.

Primary external inspiration: iOS 18 grouped app surfaces with editorial workbench density.

- System-gray canvas and grouped white materials
- Translucent navigation and floating work surfaces
- Large, direct page titles with compact operational rows
- System blue for primary action and focus
- Rounded pills for buttons, chips, and status labels
- Collapsible details instead of always-visible process panels

Do not copy Apple UI chrome literally. Use the iOS 18 language as a structural reference for calm grouped creation surfaces.

Avoid the Claude-like direction:

- No warm terracotta as the primary accent
- No parchment / beige-dominant canvas
- No rounded warm assistant aesthetic
- No explanatory marketing-page composition for core workbench screens

Avoid pure terminal-tool styling:

- Tahoe is a creator publishing desk, not a developer terminal
- Keep the reading and editing surfaces calm, grouped, and legible

## Product Tone

Tahoe is a daily owned-media publishing desk for creators who need to produce three long-form image-text articles quickly.

The interface should feel:

- editorial
- precise
- dense but calm
- publication-oriented
- serious enough for finance and AI topics
- flexible enough for fashion and consumer culture

It should not feel:

- like a generic AI SaaS dashboard
- like a workflow-control console
- like a landing page
- like a prompt-engineering lab
- like Claude's warm document UI

## Color System

Current palette direction:

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Canvas | `--canvas` | `#F2F2F7` | Page background in light mode |
| Solid surface | `--surface-solid` | `rgba(255,255,255,0.88)` | Main grouped surfaces |
| Muted surface | `--surface-muted` | `rgba(235,235,240,0.72)` | Chips, selected rows, subdued fills |
| Primary text | `--text-1` | `#1C1C1E` | Main body and headings |
| Secondary text | `--text-2` | `rgba(60,60,67,0.78)` | Metadata and descriptions |
| Tertiary text | `--text-3` | `rgba(60,60,67,0.5)` | Timestamps and low-emphasis labels |
| Sidebar | `--sidebar-bg` | `rgba(255,255,255,0.78)` | Translucent navigation shell |
| Accent | `--accent` | `#007AFF` | Primary actions, focused controls, key links |
| Accent strong | `--accent-strong` | `#0A84FF` | Hover and active action states |
| Border | `--border` | `rgba(60,60,67,0.18)` | Soft dividers and input boundaries |
| Blue status | `--slate-blue` | `#5856D6` | Draft / analysis / editorial status |
| Plum status | `--plum` | `#AF52DE` | Review and decision status |
| Orange status | `--terracotta` | `#FF9500` | Warnings or image-production attention |
| Green status | `--sage` | `#34C759` | Ready / package / calm positive status |

Rules:

- Use iOS system blue as the primary action color, not brown, orange, or Claude-like warm accents.
- Use status accents sparingly and semantically.
- Keep large surfaces neutral and editorial.
- Prefer borders, dividers, and spacing over colored containers.
- Do not introduce dominant purple gradients, beige palettes, or decorative orbs.

## Typography

Current font direction:

- UI and body: Apple system stack, `PingFang SC`, `Noto Sans SC`
- Display: Apple system display stack, `PingFang SC`, `Noto Sans SC`
- Chinese display copy should feel like a direct app title, not a marketing slogan.

Rules:

- Use large system type for page-level titles only.
- Use compact sans-serif text for dense workbench panels.
- Use small uppercase or short-label kickers sparingly.
- Do not overuse letter spacing; keep readable Chinese text normal.
- Keep title language concrete and elegant.

Preferred naming:

- `今日选题`
- `成稿编辑`
- `配图 brief`
- `出图台`
- `三线进度`
- `正文检查`
- `高级：配图细节`

Avoid:

- `每日运行台`
- `标题与文案`
- `编辑文章包`
- `脚本实验台`
- `图片生产台`
- `系统复核`
- `模型打分`

## Layout Principles

Tahoe is a workbench. The first viewport should expose the work, not explain the product.

Use:

- grouped full-width sections
- soft separators and material panels
- compact rows
- clear primary action placement
- one obvious next step per workflow state
- collapsible details for expert context

Avoid:

- nested cards
- nested grouped cards
- hero marketing blocks inside the app
- long instructional copy above the action
- duplicated empty states
- implementation terminology in default views

## Daily Run

Daily Run is the daily start surface.

Primary path:

`搜热点 -> 三个账号各选一题 -> 生成文章包 -> 进入成稿编辑 -> 发布`

Default visible structure:

1. Page title: `今日选题`
2. Short purpose line
3. Account direction chips: `AI快讯 / 全球股市 / 消费时尚`
4. Search input and `搜索热点`
5. Three account topic cards
6. One main action per account: `生成文章包`
7. Folded material and recommendation details

Hide or fold:

- source packets
- alternate topics
- recommendation rationale
- model names
- backend stages
- scoring internals

## Script Lab

Script Lab is the final light-edit page.

Default visible structure:

1. Page title: `成稿编辑`
2. Article package status
3. Draft preview / edit area
4. Title section
5. Publish-copy section
6. Image-brief status
7. Advanced details

Default copy should speak to creators:

- `可以先改正文，稍后点刷新。`
- `标题还在生成，稍后刷新。`
- `发布文案还在生成，稍后刷新。`
- `先确认文章读起来像真人写的。`

Hide or fold:

- audience-panel details
- system review details
- source material tables
- image classification
- asset-dependency internals
- model/provider names

## Components

Buttons:

- Primary actions use teal fill.
- Secondary actions use border + text.
- Destructive actions remain rare and explicit.
- Button labels should describe the user's action, not the system process.

Panels:

- Use `PanelCard` and existing local primitives.
- Keep cards quiet, with iOS-style grouped radii.
- Do not put cards inside cards.
- Prefer row groups and dividers for repeated operational data.

Inputs:

- Inputs should be full-width in primary workflows.
- Placeholder copy should be concrete and creator-facing.
- Do not prefill or auto-search without user action.

Tags:

- Use status tags only when they help the next decision.
- Prefer `推荐 / 可用 / 素材偏少 / 可发布 / 待处理`.

## Copy Rules

Good copy:

- short
- plain
- action-oriented
- creator-facing
- specific to the current next step

Bad copy:

- explains the architecture
- names model providers in the main path
- repeats the same loading state in multiple places
- says "workflow", "orchestration", "artifact", "schema", or "route" in user-facing UI
- asks the user to understand production internals before writing

## Implementation Rules

- Keep using existing CSS custom properties.
- Keep using existing UI primitives.
- Do not introduce a new UI framework.
- Do not add decorative assets unless they clarify the workflow.
- Do not change API contracts, Prisma schema, model routing, or generation behavior for visual-only work.
- When UI changes are made, run `npm run lint` and `npm run build` unless the task is documentation-only.
