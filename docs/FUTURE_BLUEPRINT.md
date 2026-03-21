# Future Blueprint

> This file captures **future direction**, not the current sprint scope.
> Tahoe should not jump into large-scale rewrites just because these ideas are important.
> Near-term execution still prioritizes: better output quality, clearer user flow, and artifact-first UX.

## Why This Exists

Tahoe already has a strong MVP skeleton:
- two business lines
- intent-first project creation
- artifact-oriented routing
- storyboard-first generation
- lightweight workbenches for copy, creative, and scenes

But if Tahoe wants to grow from a good demo into a real enterprise creative production tool, we need a clearer long-term blueprint.

This document records that blueprint so the team can align now without prematurely turning it into the active build plan.

## Current Bottlenecks

### 1. Workflow rigidity
- The current system is still primarily a **fixed orchestrated pipeline**.
- `WorkflowService` and related generators can branch, but they do not truly pause, reflect, re-plan, or ask for help when inputs are weak.
- Result: Tahoe can route work, but it does not yet behave like a strong creative agent.

### 2. Brand memory is still shallow
- Tahoe already has `BrandProfile`, `IndustryTemplate`, `CreativeBrief`, `styleReferenceSample`, and related context objects.
- But most of that context is still injected as prompt text, not retrieved as a durable memory system.
- Result: each new project still feels too close to "start from zero."

### 3. Multimodal grounding is limited
- Tahoe now writes better prompts for Nano Banana 2 / Pro, Seedance 2.0, and Veo 3.1.
- But it still mostly reasons **through text about visuals**, rather than grounding itself in retrieved visual/audio references and validating outputs against those references.
- Result: prompt quality improves, but visual consistency and brand fidelity are still fragile.

### 4. Execution gap remains
- Tahoe can produce scripts, copy, storyboards, prompts, and asset plans.
- But it still stops short of becoming a true downstream production engine with editable engineering-ready outputs for creative software pipelines.

## Long-Term Direction

## Direction 1: Move From Fixed Pipeline Toward Agentic Review Loops

This is important, but the next step should **not** be "add many agents everywhere."

### What Tahoe should eventually become
- a system that can:
  - notice weak inputs
  - detect low-quality outputs
  - decide when to rework
  - decide when to stop and ask for human judgment

### What Tahoe should **not** do yet
- do not jump straight into a large AutoGen/CrewAI-style multi-agent mesh
- do not introduce many autonomous agents without shared artifact contracts and evaluation criteria
- do not let future agent design distract from current output-quality and UX work

### Recommended evolution path
1. Add structured critique / evaluation
   - let Tahoe score artifacts for brand fit, platform fit, visual readiness, clarity, and compliance
2. Add review loops
   - generator creates
   - reviewer critiques
   - generator revises
3. Add a light director/planner layer later
   - only after artifact contracts and evaluation signals are stable
4. Consider fuller multi-agent collaboration after that

### Practical interpretation
- Long-term target: **agentic system**
- Near-term implementation style: **single main flow + stronger reviewer loop**

## Direction 2: Build Multimodal Brand Memory and Retrieval

This is the more durable enterprise moat.

### What Tahoe should eventually become
- a system that can create with memory of:
  - brand voice
  - brand constraints
  - historical high-performing copy
  - key visual motifs
  - reference images
  - reference videos
  - shot rhythm and recurring creative patterns

### What Tahoe has today
- structured brand/industry/brief context
- uploaded assets
- style-reference samples

### What is still missing
- retrieval across prior projects and assets
- persistent reusable creative memory
- cross-modal search over text + images + keyframes + video slices
- output-time grounding against reference materials

### Recommended evolution path
1. Text memory first
   - brand guidelines
   - approved copy
   - prior scripts
   - briefs
   - forbidden phrases / boundaries
2. Image and keyframe memory second
   - reference images
   - key visual frames
   - campaign style boards
   - product appearance anchors
3. Video and audio memory third
   - reference video segmentation
   - rhythm / pacing metadata
   - shot pattern memory
   - voice / soundtrack traits

### Practical interpretation
- Long-term target: **multimodal RAG for enterprise brand alignment**
- Near-term implementation style: **better context modeling now, retrieval system later**

## Foundational Layers Tahoe Will Likely Need

These are not immediate implementation tasks, but they help explain where the architecture should head.

### 1. Artifact graph
- represent evidence, brief, script, scene, storyboard, prompt, render asset, and publish asset as connected objects

### 2. Evaluation layer
- structured scoring for:
  - brand fit
  - platform fit
  - visual readiness
  - conversion strength
  - compliance risk
  - distinctiveness

### 3. Retrieval layer
- shared retrieval over:
  - brand docs
  - historical high-performing artifacts
  - uploaded references
  - visual/video examples

Without these three layers, "multi-agent" and "multimodal" expansion will be fragile.

## What This Means For The Current Sprint

This blueprint does **not** change the active priority order.

Current focus remains:
- improve content quality
- improve prompt quality
- improve artifact-first UX
- reduce workflow confusion
- improve generation feedback and model-readiness checks

That means:
- do not pause current product cleanup work to build a big agent framework
- do not pause current product cleanup work to build a full vector platform
- only make near-term changes that strengthen current outputs and keep future evolution easier

## Current Planning Rule

When deciding whether a new change belongs in the current sprint or the future roadmap, ask:

1. Does it directly improve the quality of the next usable artifact?
2. Does it directly reduce user confusion in the current product?
3. Does it create a clean seam for future agentic review loops or future retrieval?

If the answer is only "future potential," it belongs in this document, not in the active build queue.
