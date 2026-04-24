# Daily Run Plan

> Last updated: 2026-04-23 by Codex
> This document defines the near-term product plan for Tahoe's daily article pipeline.

## Goal

Turn Tahoe into a system that can run the same high-value loop every day:

1. collect the newest and hottest signals
2. decide which topics each account should cover
3. generate a usable first draft
4. review the draft from multiple audience angles
5. produce matching static images
6. output publish-ready packaging

This is the near-term production loop that matters more than any additional workflow expansion.

## Core Principle

Tahoe should not ask the team to manually stitch together five separate pages every day.

Tahoe should provide one **daily run surface** that answers:

- what happened today
- what is worth writing today
- which account should take it
- which items are ready for draft generation
- which drafts are blocked by review
- which pieces are blocked by image quality
- which pieces are ready to publish

## Daily Run Output

Each account should aim to produce a small number of **publishable article packages**, not a large number of unfinished drafts.

One article package means:

- topic card
- title
- lead
- master draft
- image brief
- image selection
- publish summary / publish copy

## Accounts Covered

The daily run should support the three current owned-media accounts:

1. `AI快讯`
2. `全球股市`
3. `消费时尚`

The same source event may appear in multiple account lanes, but with different framing.

## Daily Run Stages

### Stage 1: Signal Intake

Collect source signals from:

- Serper news search
- curated web search
- manually added links / notes
- future platform-specific indexed sources

The output at this stage is not a draft.

It is a `Signal Card`:

- title
- source
- url
- publish time
- short summary
- heat / freshness
- tags

### Stage 2: Topic Triage

Convert signals into `Topic Cards`.

Each topic card should answer:

- what happened
- why it matters
- which account it best fits
- what angle should be taken
- whether it is worth writing today

Each topic card should also carry:

- freshness score
- heat score
- account-fit score
- recommended angle

### Stage 3: Account Assignment

Assign each topic to one account lane:

- `AI快讯`
- `全球股市`
- `消费时尚`

Important:

- assignment should not only follow raw heat
- assignment should follow account role and reader promise

Examples:

- `AI快讯`: explain the AI change
- `全球股市`: explain the market variable
- `消费时尚`: explain the brand / runway / consumer signal

### Stage 4: Draft Generation

For each selected topic, generate:

- draft title
- lead
- master draft
- short publish summary
- image brief seed

This stage should optimize for a **good first draft**, not for a fully polished final piece.

### Stage 5: Multi-Audience Review

Run the existing review layer against the draft.

The review should produce:

- publishability score
- main weaknesses
- revision priority
- audience panel reactions

Recommended fixed reviewers:

1. `feed_scanner`
2. `skeptical_reader`
3. `editor`
4. `sharer`

The daily run surface should show a simple verdict:

- `Ready`
- `Revise draft`
- `Revise angle`

### Stage 6: Image Brief and Image Production

If the draft passes the first review threshold:

- produce or refine image brief rows
- run image-brief readiness review
- generate image jobs
- capture result feedback

The image stage should also surface one clear state:

- `Ready for image`
- `Revise brief`
- `Retry image`

### Stage 7: Publish Packaging

Once draft + image are both acceptable:

- generate title pack
- generate publish copy
- generate short summary / abstract

The final article package should then move to:

- `Ready to publish`

## Proposed Product Surface

Tahoe should add one new top-level operational surface:

## `Daily Run / 每日运行台`

This page should not replace Today, Script Lab, Scene Planner, or Render Lab.

It should orchestrate them.

### Section A: Today's Signals

Show the best incoming signals with:

- source
- freshness
- heat
- tags
- quick dismiss
- quick keep

### Section B: Account Lanes

Show three columns:

1. `AI快讯`
2. `全球股市`
3. `消费时尚`

Each lane should show:

- today's recommended topics
- current account-fit angle
- current status

### Section C: Work Queue

Each selected topic should move through a queue:

- `待选题`
- `待起稿`
- `待审核`
- `待配图`
- `待包装`
- `可发布`

This is the main operational state model.

### Section D: Blockers

The page should also show only a small number of blockers:

- weak draft
- weak image brief
- image retry needed
- packaging still weak

Do not make the user open four pages just to discover where the blockage is.

## Data Model Suggestion

Near-term, Tahoe does not need a large new workflow engine.

Start with one lightweight `daily_run_item` concept in the read model / service layer.

Each item should track:

- source signal id(s)
- project id
- account lane
- topic
- angle
- status
- current draft verdict
- current image verdict
- current package verdict
- ready_to_publish boolean

## MVP Scope

The first version should stay small.

### V1 must do:

- ingest today's signals
- let users assign a topic to one of three account lanes
- create a project from that topic + lane
- show current status:
  - draft
  - review
  - image
  - packaging
- show one next action button

### V1 should not do yet:

- automatic publishing
- full analytics dashboard
- heavy multi-agent orchestration
- deep cross-account content calendar logic

## Recommended "Next Action" Logic

For each daily run item, Tahoe should compute one best next step:

- no draft -> `生成主稿`
- weak draft -> `修主稿`
- draft ok, no image brief -> `生成配图说明`
- weak image brief -> `修配图说明`
- image brief ok, no image -> `去出图`
- image weak -> `重试图片`
- draft + image ok, no package -> `生成发布包装`
- all ok -> `准备发布`

This should be the main daily productivity lever.

## Success Criteria

The daily run is working when:

- three accounts can all receive topic candidates daily
- the team can see what is worth writing without manually searching multiple pages
- each topic shows one clear state and one clear next action
- publishable article packages can be produced more consistently
- review and image feedback reduce waste instead of living in isolated pages

## Build Priority

### Priority 1

Build the daily operational surface and status model.

### Priority 2

Bind today's signals to account-lane topic triage.

### Priority 3

Bind existing draft review, image-brief review, and image feedback into one item status.

### Priority 4

Only after the above is stable, consider:

- scheduling
- auto-promotion
- recurring runs
- heavier agent delegation
