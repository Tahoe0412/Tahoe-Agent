# Project Structure

本文记录当前项目结构和下一步整理规则。目标是学习清晰分层的优点，但保留 Next.js 全栈单仓库的低复杂度。

## Current Shape

```text
app/                 Next.js pages, layouts, errors, route handlers
components/          UI primitives and feature workbench components
hooks/               Client hooks for UI-triggered workflows
lib/                 Cross-cutting helpers, env, API response, prompts, copy
services/            Business logic, integrations, AI output handling
schemas/             Zod schemas for API/domain/AI boundaries
types/               Shared TypeScript domain types
prisma/              Prisma schema and migrations
tests/               Vitest tests
docs/                Product, architecture, deployment and operation docs
scripts/             Deployment and maintenance scripts
public/              Static assets and local upload target
```

## Layering Rules

- `app/**/page.tsx` should compose route-level UI only.
- `app/api/**/route.ts` should parse input, validate, call service and return `ok` / `fail`.
- Business branching, aggregation, scoring, AI output shaping and database workflows belong in `services/`.
- External input boundaries belong in `schemas/` or explicit TypeScript types.
- Shared UI belongs in `components/ui`; workflow-specific UI belongs in feature folders.
- Prompt builders and AI JSON schema helpers should be grouped with the domain they serve when they are not truly cross-cutting.

## Preferred New Feature Path

Use this order for new capabilities:

```text
page -> workbench/component -> hook/client -> api route -> service -> schema/type -> tests
```

This keeps UI composition, request transport, backend orchestration and validation visible without forcing a separate backend app.

## Refactor Priorities

1. Keep documentation aligned with actual files and commands.
2. Move remaining orchestration-heavy route handlers into services.
3. Split very large workbench components by state, action controls, forms and data panels.
4. Group new tests by subsystem under `tests/services`, `tests/api` and `tests/lib`.
5. Reduce `lib` catch-all growth by creating focused subfolders only when files are actively being touched.

## Root Directory Noise

The following paths are not part of the main application runtime and should be treated as archive candidates before any future cleanup:

- `analysis/`
- `econometrics_assignment2b_bundle/`
- `tmp/`
- `output/`
- `.playwright-cli/`

Do not move or delete them as part of unrelated refactors. If they are archived later, do it in a separate change so app diffs stay readable.

## What We Are Not Doing

- No `frontend/` + `backend/` split.
- No migration to `src/`.
- No bulk import rewrite just to make folders look cleaner.
- No database schema or API response shape changes as part of structure cleanup.
