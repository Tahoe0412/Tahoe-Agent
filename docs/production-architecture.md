# AI Video Ops Production Architecture

## Positioning

The product should be treated as an `AI 广告创意控制台`, not a single-step generator.
Its job is to convert a raw idea into a production-ready package through a structured pre-production workflow:

1. research
2. creative brief
3. script rewrite
4. storyboard planning
5. asset planning
6. render execution
7. review and export

The system center is `workflow + schema + approval + state`, not a specific model provider.

## System Layers

### 1. Control Plane

Owns orchestration, configuration, approvals, and project state.

- project lifecycle
- provider settings
- workflow orchestration
- approval gates
- version management
- audit / review notes

### 2. Intelligence Plane

Turns external signals and creative intent into structured planning artifacts.

- trend research
- creator discovery
- script rewriter
- scene classification
- asset dependency analyzer
- report generator

### 3. Production Planning Plane

Converts planning outputs into assets that are directly executable by image/video pipelines.

- creative briefs
- storyboards
- storyboard frames
- frame references
- continuity groups
- production difficulty and dependency planning

### 4. Execution Plane

Runs render jobs and stores machine outputs.

- image jobs
- video jobs
- voice/music jobs
- generated assets
- export bundles

## Core Domain Objects

### Project

The root container for a full campaign or creative exploration.

### CreativeBrief

The normalized business intent object. This should become the main upstream artifact after project creation.

Owns:

- campaign objective
- platform scope
- target audience
- key message
- CTA
- hard / soft constraints

### ApprovalGate

The explicit checkpoint between major stages.

Required stages:

- BRIEF
- RESEARCH
- SCRIPT
- STORYBOARD
- ASSET_PLAN
- RENDER
- DELIVERY

### Storyboard

A versioned visual plan derived from a brief and/or script.

### StoryboardFrame

A render-ready shot card for a single visual unit.

Should contain:

- visual prompt
- negative prompt
- narration
- motion / camera plan
- continuity group
- production class
- references

### RenderJob

A queueable execution unit for image/video/audio generation.

Render jobs should stay separate from research jobs.

## Current Implementation Status

Already implemented:

- trend research
- script rewrite
- scene classification
- asset dependency analysis
- workflow run
- provider abstraction
- settings control plane

Added in this phase:

- creative briefs
- brief constraints
- approval gates
- storyboards
- storyboard frames
- frame references
- render jobs
- render assets
- review notes

## Recommended Next Build Order

1. Brief Studio UI
2. approval gate actions in Dashboard
3. storyboard generation from latest script scenes
4. frame reference upload and reference panel
5. render job queue UI
6. proposal export and review workspace

## Architectural Rules

- All AI outputs must be schema-constrained and persisted.
- Every stage must be replayable.
- Every major artifact must be versioned.
- Human review is part of the workflow, not an exception path.
- Render execution must not mutate research artifacts directly.
