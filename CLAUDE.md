# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not a software codebase** — it is an [Obsidian](https://obsidian.md) vault used as the documentation system for a project called **Grade Runway**. There is no source code, no package manager, no build, lint, or test commands. All work here consists of reading and writing Markdown files under `docs/`.

All documentation content is written in **Thai**. Match that language when editing or adding to existing docs unless the user asks otherwise.

## Structure and workflow

Every folder under `docs/` has an `index.md` that explains its purpose and links to child folders/siblings using Obsidian wikilink syntax (`[[relative/path/index|Label]]`). When adding a new document, add a corresponding link from the relevant `index.md` files so the doc stays discoverable from the tree.

The docs are organized around a linear project workflow, and folder numbering reflects that order:

```
01-requirements → 02-design → 03-testing → 04-retrospectives
                                   ↑
                                05-log (written continuously throughout, not gated on any phase)
```

- **`docs/01-requirements/`** — starting point for any new feature/project.
  - `01-spec/` — source-of-truth requirements: features, user stories, business rules, scope.
  - `02-plan/` — roadmap/timeline/milestones derived from spec.
  - `03-task/` — concrete, actionable task breakdown derived from plan.
- **`docs/02-design/`** — design derived from requirements.
  - `01-prototypes/` — UI/UX wireframes, mockups, user flows, design system basics.
  - `02-technical/` — architecture, database schema, API/data contracts, tech choices + rationale.
- **`docs/03-testing/`** — testing derived from design.
  - `01-test-plan/` — test cases/scenarios, test data, in/out of scope.
  - `02-test-result/` — actual pass/fail results, bugs found, fix status.
- **`docs/04-retrospectives/`** — lessons learned after each phase/sprint/milestone, informed by test results and the log.
- **`docs/05-log/`** — chronological changelog / decision log / notable events, updated continuously in parallel with the other phases (not sequential like the rest).
- **`docs/00-archived/`** — superseded or cancelled documents. **Never delete a doc from the project — move it here instead** to preserve decision history.

## Conventions when editing docs

- Keep each `index.md` as a short folder-purpose summary plus wikilinks to children/related folders — it is navigation, not content itself. Put actual content in new files within the appropriate subfolder.
- Preserve the forward-reference pattern used throughout: each stage's `index.md` says where its output feeds next (e.g. spec → plan → task → design → testing → retrospectives), and each links back to where its inputs come from. When adding a new doc, keep this chain intact.
- Follow the existing `NN-kebab-case` numeric-prefix naming for new top-level or second-level folders if the workflow ever grows a new stage.
