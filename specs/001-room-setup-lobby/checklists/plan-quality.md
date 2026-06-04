# Plan Quality Checklist: Room Setup & Lobby

**Purpose**: Validate requirements quality, completeness, clarity, and consistency across spec and plan before task generation
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)
**Depth**: Standard | **Focus**: All areas equally | **Audience**: Author (pre-tasks gate)

---

## Requirement Completeness

- [x] CHK001 — Are host assignment requirements defined for all room entry points (create only, or also rejoin)? [Completeness, Spec §FR-001] — create only; rejoin out of scope per assumptions
- [x] CHK002 — Are requirements specified for what happens when the host navigates away from the lobby before starting? [Completeness, Gap] — out of scope per assumptions; host transfer not supported
- [x] CHK003 — Is the polling behaviour defined for both create-room and join-room flows, or lobby only? [Completeness, Spec §FR-003] — lobby only ("while lobby screen is mounted")
- [x] CHK004 — Are requirements defined for the participant list display order? [Completeness, Gap] — join order (append); acceptable default for this lab
- [x] CHK005 — Is the maximum number of participants per room specified, or intentionally unbounded? [Completeness, Assumption] — intentionally unbounded; in-memory lab context

---

## Requirement Clarity

- [x] CHK006 — Is "~2 seconds" polling cadence quantified precisely enough to be testable? [Clarity, Spec §FR-003] — FR-003 + SC-002 together are sufficient for manual tab test
- [x] CHK007 — Is "clearly identified" (host visual indicator) defined with specific UI requirements? [Clarity, Spec §US1-AC2] — left to implementation ("badge, label, or visual indicator"); acceptable for this lab
- [x] CHK008 — Is "empty room code" defined — zero-length only, or also whitespace-only? [Clarity, Spec §FR-006] — **fixed**: FR-006 now reads "empty or whitespace-only"
- [x] CHK009 — Is the exact wording of the two error messages locked? [Clarity, Spec §FR-006, FR-007] — exact strings in FR-006 and FR-007
- [x] CHK010 — Is "navigate away from the lobby screen" defined? [Clarity, Spec §FR-009] — in-app navigation only; browser close out of scope

---

## Requirement Consistency

- [x] CHK011 — Does the plan's polling data flow align with the spec edge case and clarification Q1? [Consistency] — ✅ aligned
- [x] CHK012 — Does the plan's Start Game behaviour align with spec clarification Q2 and US4-AC4? [Consistency] — ✅ aligned
- [x] CHK013 — Is `hostId` consistent across spec, plan, data-model.md, and contracts/rooms.md? [Consistency] — ✅ consistent
- [x] CHK014 — Do contracts/rooms.md error messages match FR-006 and FR-007 exactly? [Consistency] — ✅ match
- [x] CHK015 — Is the join validation split (schema for empty, service for not-found) consistent? [Consistency, Plan §Decision 3] — ✅ consistent

---

## Acceptance Criteria Quality

- [x] CHK016 — Are all 4 user story acceptance scenarios independently testable with two browser tabs? [Measurability, Spec §US1–US4] — ✅ all testable
- [x] CHK017 — Is SC-002 measurable with the Network tab alone? [Measurability, Spec §SC-002] — ✅ yes
- [x] CHK018 — Is SC-003 measurable given two distinct error paths? [Measurability, Spec §SC-003] — ✅ yes
- [x] CHK019 — Is SC-004 falsifiable? [Measurability, Spec §SC-004] — **fixed**: explicit falsifiable test added to SC-004
- [x] CHK020 — Does each FR have at least one corresponding acceptance scenario or success criterion? [Traceability, Spec §FR-001–FR-010] — ✅ all covered

---

## Scenario Coverage

- [x] CHK021 — Are requirements defined for join when game already started? [Coverage, Gap] — Scenario 2 scope; out of scope here
- [x] CHK022 — Are requirements specified for two players joining simultaneously? [Coverage, Edge Case] — idempotent GET; safe; in-memory append
- [x] CHK023 — Is duplicate join behaviour defined? [Coverage, Gap] — **fixed**: new edge case added — creates new participant entry; deduplication out of scope
- [x] CHK024 — Are requirements defined for what non-host players see instead of Start button? [Coverage, Spec §FR-004] — US4-AC3: no button visible
- [x] CHK025 — Is recovery after network interruption covered? [Coverage, Spec §FR-010] — FR-010 covers retry

---

## Edge Case Coverage

- [x] CHK026 — Lowercase room code input handling defined? [Edge Case, Spec §Assumptions] — assumption: starter already handles uppercase conversion
- [x] CHK027 — Cold 404 (valid format, never created) covered? [Edge Case, Spec §Edge Cases] — edge case covers this
- [x] CHK028 — Is count check client-side or server-side? [Edge Case, Spec §FR-005] — client-side render guard; server enforces in Scenario 2
- [x] CHK029 — What if poll response takes longer than 2 seconds? [Edge Case, Gap] — **fixed**: new edge case added — interval fires independently; idempotent GET; last response wins

---

## Non-Functional Requirements

- [x] CHK030 — Accessibility for disabled Start button? [Coverage, Gap] — out of scope for this lab
- [x] CHK031 — Polling performance impact acknowledged? [Non-Functional, Plan §Risks] — ✅ in plan risks
- [x] CHK032 — Browser compatibility defined? [Non-Functional, Assumption] — modern browsers assumed; lab context

---

## Dependencies & Assumptions

- [x] CHK033 — Host-not-transferred assumption documented? [Assumption, Spec §Assumptions] — ✅ documented
- [x] CHK034 — participantId lost on refresh acknowledged? [Assumption, Plan §Risks] — ✅ in plan risks
- [x] CHK035 — Polling reuses existing endpoint documented? [Dependency, Plan §Decision 2] — ✅ documented
- [x] CHK036 — Starter bug fix scoped per constitution? [Assumption, Plan §Decision 4] — ✅ documented

---

## Summary

**36/36 items passing.** 4 gaps found and fixed in spec before tasks:
- CHK008 — FR-006 updated to include whitespace-only codes
- CHK019 — SC-004 updated with explicit falsifiable test
- CHK023 — Duplicate join edge case documented
- CHK029 — Slow poll response edge case documented

**Ready for `/speckit.tasks`.**
