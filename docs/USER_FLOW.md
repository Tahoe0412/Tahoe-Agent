# User Flow

> A product-facing map of Tahoe's current user journey.
> Use this before changing pages, prompts, or workflow routing.

## Product Principle

Tahoe should help the user do one thing well:

**turn one topic into one usable output with as little friction as possible**

This means:
- the user should think in terms of **business line + target output**
- the system should think in terms of **workflow steps + data preparation**
- pages should present **one primary next action**
- research, briefs, reports, and internal processing should stay in the background unless needed

## Core Business Lines

### Mars Citizen
- Goal: produce science / tech / future-facing short-form video content
- Typical outputs:
  - `NARRATIVE_SCRIPT`
  - `STORYBOARD_SCRIPT`
  - `VIDEO_TITLE`
  - `PUBLISH_COPY`

### Marketing
- Goal: produce platform copy, ad creative direction, and ad storyboard assets
- Typical outputs:
  - `PLATFORM_COPY`
  - `AD_CREATIVE`
  - `AD_STORYBOARD`
  - `AD_SCRIPT`

## Main User Flows

### Flow A: Mars Citizen

1. Find a topic
   - from Today
   - or directly from homepage project creation
2. Create project intent
   - choose `MARS_CITIZEN`
   - choose target output
   - enter topic
3. Generate first usable artifact
   - narrative script
   - storyboard
   - title pack
   - publish copy
4. Polish in the natural workbench
   - script -> Script Lab
   - packaging -> Script Lab
   - storyboard -> Scene Planner
5. Prepare render
   - Render Lab

### Flow B: Marketing

1. Find a topic / product angle
   - from Today
   - or directly from homepage project creation
2. Create project intent
   - choose `MARKETING`
   - choose target output
   - enter topic / product theme
3. Generate first usable artifact
   - platform copy
   - ad creative
   - ad storyboard
4. Polish in the natural workbench
   - copy / creative -> Marketing Ops
   - storyboard -> Scene Planner or Marketing bridge
5. Prepare delivery
   - adaptation / compliance / export as needed

## Page Responsibilities

### Homepage `/`
- Role: task-entry board + current project dashboard
- Should answer:
  - what should I do first?
  - what is my current project?
  - what is the next best action?
- Should not become:
  - a workflow encyclopedia
  - a full reporting console

### Today `/today`
- Role: topic discovery and material selection
- Should answer:
  - what is worth doing today?
  - which facts / signals do I want to use?
- Should hand off:
  - `topic`
  - `contentLine`
  - `outputType`

### Script Lab `/script-lab`
- Role: Mars Citizen script + packaging polish surface
- Should answer:
  - is the script usable?
  - are title and publish copy good enough?
  - what needs fixing before storyboard / render?

### Marketing Ops `/marketing-ops`
- Role: Marketing content polish surface
- Should answer:
  - is the copy on-strategy?
  - is the creative direction clear?
  - is the ad storyboard ready to continue?

### Scene Planner `/scene-planner`
- Role: shot planning and prompt-level visual preparation
- Should answer:
  - does each scene have a clear visual job?
  - are prompts usable for image / video generation?
  - is continuity strong enough?

### Render Lab `/render-lab`
- Role: render preparation and execution
- Should answer:
  - are assets and prompts ready?
  - can the project move into generation now?

## Current Routing Rules

### Homepage next-step logic
- no project -> create new project
- storyboard outputs -> Scene Planner or Render Lab
- Mars narrative outputs -> Script Lab, then storyboard, then render
- Marketing outputs -> Marketing Ops

### Output Studio routing
- `VIDEO_TITLE` / `PUBLISH_COPY` -> Script Lab
- `PLATFORM_COPY` / `AD_CREATIVE` -> Marketing Ops
- `STORYBOARD_SCRIPT` / `AD_STORYBOARD` -> Scene Planner

### Today routing
- Mars fact-to-script can generate directly into Script Lab
- other Today actions currently create or prefill project intent, then continue into downstream pages

## Current Friction Points

### 1. Today is not yet equally direct for all outputs
- Mars script generation is already direct
- Marketing outputs still feel more like "jump to create project first" than "generate from selected materials"

### 2. Script Lab empty state still teaches old workflow language
- current wording still mentions "run full dashboard workflow" / "trigger script rewrite first"
- this conflicts with shell-project and minimal-first principles

### 3. Marketing flow still has weaker visible next-step guidance
- homepage and Output Studio help
- but Marketing Ops can still feel like a dense operations page instead of a simple polish surface

### 4. Quality feedback after generation is still shallow
- user can generate artifacts
- but the system gives limited explanation of:
  - what improved
  - what is weak
  - what to do next

### 5. Storyboard quality should continue shifting toward generation-readiness
- especially for Nano Banana 2 / Pro, Seedance 2.0, and Veo 3.1
- prompt text must optimize for visual continuity and production execution, not only readability

## What To Improve Next

### Priority 1: content quality
- sharpen output-specific prompting
- improve Mars script quality
- improve Marketing creative and copy quality
- improve storyboard prompt anatomy and continuity language

### Priority 2: interaction quality
- reduce unnecessary hops between pages
- make every page expose one obvious primary action
- improve post-generation guidance and empty states

### Priority 3: workflow clarity
- keep user-facing flow artifact-first
- keep system-facing flow workflow-first
- do not leak internal sequencing into the default UI

## Working Rule For Future Changes

Before adding any new page, card, field, or step, ask:

1. Does this help the user get a better first artifact?
2. Does this reduce confusion about what to do next?
3. Can this stay hidden until it is actually needed?

If the answer is mostly "no", do not add it to the default flow.
