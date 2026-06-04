<!-- SYNC IMPACT REPORT
  Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections: Core Principles, Technical Constraints, AI Usage & Review Discipline, Governance
  Removed sections: N/A
  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — Constitution Check section applies
    ✅ .specify/templates/spec-template.md — scope constraints reflected
    ✅ .specify/templates/tasks-template.md — no principle-driven task types removed
  Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Brownfield-First (NON-NEGOTIABLE)

The starter codebase MUST be read and understood before any new code is written.
Existing files, routes, models, and components MUST NOT be rewritten from scratch.
Refactors unrelated to the current feature slice are forbidden.
Every change MUST be the minimum required to satisfy the current spec slice.
Bugs in the starter MAY be fixed if they directly block a spec requirement — the fix MUST be scoped and documented (e.g. the `/bug` suffix in `frontend/src/services/api.ts:22` blocks all API calls and must be corrected).

**Rationale**: Rewriting destroys traceability and creates drift between the spec, plan, tasks, and implementation. The grader assesses the diff, not a greenfield build. Starter bugs that block spec delivery are legitimate fixes, not scope creep.

### II. Spec-Driven Development (NON-NEGOTIABLE)

No implementation work begins without an accepted spec slice covering that feature.
Every code change MUST be traceable to a specific acceptance criterion in `.specify/`.
Deviations from the spec MUST be documented before committing.
The order MUST be: specify → clarify → plan → tasks → implement → validate.

**Rationale**: The assignment grades spec-to-code traceability explicitly. Code written without a spec cannot be reviewed for correctness.

### III. Deterministic Game Rules

Word selection MUST use a fixed index derived from a deterministic rule (e.g., room creation count mod word list length), never `Math.random()` at game-start time.
Scoring MUST be rule-based: correct guess = 100 points, incorrect = 0 points, no exceptions.
These rules MUST be documented in the spec before implementation.

**Rationale**: Non-deterministic behavior makes validation impossible across two browser tabs and makes automated grading unreliable.

### IV. Polling Only — No Real-Time Push

All player synchronisation MUST use HTTP polling at approximately 2-second intervals.
WebSockets, Server-Sent Events, Socket.io, or any push protocol are strictly forbidden.
Polling MUST reuse the existing `GET /rooms/:code` endpoint wherever possible.

**Rationale**: The assignment explicitly forbids WebSockets. Using them voids the submission. Polling is sufficient for the single-round, small-player-count game modelled here.

### V. Incremental Validation

Each feature slice MUST be validated in two browser tabs before the next slice begins.
A slice is only complete when its acceptance criteria pass in the live app, not just in code review.
Build validation (`npm run build` in both `backend/` and `frontend/`) MUST pass before raising a PR.

**Rationale**: The assignment requires each phased checkpoint to be verified before moving forward. Silent failures accumulate and are hard to debug retroactively.

### VI. AI Review Discipline

All AI-generated code MUST be reviewed line-by-line before committing.
AI output MUST NOT be committed if it introduces out-of-scope behavior, new dependencies, or deviates from the spec.
Every commit message MUST be human-authored and reference the spec slice it implements.

**Rationale**: The grader assesses whether the implementer can critically review AI output. Blind acceptance is an explicit failure mode called out in the rubric.

## Technical Constraints

**Stack** (fixed — do not add to):
- Backend: Node.js + Express + TypeScript, validated with Zod, run via `tsx`
- Frontend: React 18 + React Router v6 + Vite + TypeScript
- State: in-memory only on the backend (`Map<string, Room>`); frontend state via existing `roomStore.ts`
- Sync: HTTP polling ~2s via existing `GET /rooms/:code`

**Explicitly out of scope — MUST NOT appear in spec, plan, or tasks**:
- WebSockets, SSE, or any push protocol
- Databases or persistent storage of any kind
- Authentication, sessions, JWT, or OAuth
- Multiple rounds, drawer rotation, timers, or countdowns
- New state-management or routing libraries beyond the starter
- Deployment, hosting, CI/CD, or Docker
- Spectator mode, kick/mute, room passwords, invite links
- Custom or random word packs

**Dependency rule**: No new `npm` packages may be added unless they replace a broken starter dependency. All new functionality MUST use what the starter already ships.

## AI Usage & Review Discipline

- AI assistants (including Claude Code) MAY be used to draft spec artifacts, plan files, and implementation code.
- Every AI-generated artifact MUST be reviewed and edited by the implementer before committing.
- The implementer MUST be able to explain every line of committed code.
- AI usage MUST be disclosed in `REFLECTION.md`.
- AI MUST NOT be used to bypass the specify → plan → tasks → implement order.

## Governance

This constitution supersedes all other informal practices for this project.
Amendments require updating this file, incrementing the version, and noting the change in the Sync Impact Report above.
All PRs MUST be checked against this constitution before merge.
The rubric in `README.md` is the external compliance reference; this constitution is the internal enforcement document.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
