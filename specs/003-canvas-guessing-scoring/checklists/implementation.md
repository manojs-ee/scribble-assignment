# Implementation Requirements Checklist: Drawing Canvas, Guessing & Scoring

**Purpose**: Validate that requirements in spec, clarifications, plan, and contracts are complete, clear, consistent, and measurable before task generation
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/api.md](../contracts/api.md)

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for what the drawer sees when no strokes have been drawn yet (empty canvas state)? [Completeness, Gap]
- [ ] CHK002 - Is the visual indicator for correct vs incorrect guesses in the guess history specified (e.g., specific symbol, colour, text)? [Completeness, Spec §FR-009]
- [ ] CHK003 - Are requirements defined for what happens when `POST /rooms/:code/stroke` or `POST /rooms/:code/guess` is called on a room in "lobby" status (pre-game)? [Completeness, Spec §FR-004, contracts/api.md]
- [ ] CHK004 - Is the stroke data payload size or point count bounded by any requirement (e.g., maximum points per stroke)? [Completeness, Gap]
- [ ] CHK005 - Are requirements defined for the guesser canvas state between polls — is there a loading/waiting indicator, or does it simply show the last-known state? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK006 - Is "read-only" for the guesser canvas defined with sufficient precision — does it mean no event handlers attached, or a visual disabled state, or both? [Clarity, Spec §FR-003]
- [ ] CHK007 - Is "case-insensitive match" in FR-006 precisely defined — does it apply to `text.trim().toLowerCase()` vs `currentWord.toLowerCase()`, and is leading/trailing whitespace trimmed from guesses? [Clarity, Spec §FR-006]
- [ ] CHK008 - Is the scoreboard sort order specified — highest score first, or join order, or alphabetical? [Clarity, Spec §FR-010, Gap]
- [ ] CHK009 - Is "chronological order" for guess history (FR-009) defined as server-received timestamp order or submission order? [Clarity, Spec §FR-009]
- [ ] CHK010 - Is the inline error message text for empty guess submission fixed ("Guess cannot be empty") or is any non-empty message acceptable? [Clarity, Spec §FR-011]

## Requirement Consistency

- [ ] CHK011 - Is FR-012 (score cap at 100 for repeated correct guesses) consistent with the edge case "duplicate correct guess → second is recorded but score doesn't double"? The spec says isCorrect=false on the second attempt — does FR-006 reflect this? [Consistency, Spec §FR-006, FR-012, Edge Cases]
- [ ] CHK012 - Does the `GuessSnapshot` entity in data-model.md include all fields referenced in contracts/api.md (id, participantId, participantName, text, isCorrect, timestamp)? [Consistency, data-model.md, contracts/api.md]
- [ ] CHK013 - Is FR-005 ("drawer MUST NOT see the guess input") consistent with plan.md Phase D which says "hide GuessForm entirely for drawer"? Both should specify the same enforcement level. [Consistency, Spec §FR-005, plan.md §D1]

## Acceptance Criteria Quality

- [ ] CHK014 - Is SC-001 ("stroke rendering immediate on local machine") measurable without implementation instrumentation, or does it need a specific threshold (e.g., "within one frame / 16ms")? [Measurability, Spec §SC-001]
- [ ] CHK015 - Is SC-002 ("guesser canvas reflects drawer state within ≤2 seconds") verifiable by observing two browser tabs with a clock, without any special tooling? [Measurability, Spec §SC-002]
- [ ] CHK016 - Is SC-005 ("scoreboard correctly shows 100 pts for correct guesser, 0 for all others") fully verifiable with a two-tab test alone, or does it require inspecting the raw polling response? [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK017 - Are requirements defined for the drawer's experience after a guesser has found the correct word — does the canvas remain active, is there any feedback to the drawer? [Coverage, Gap]
- [ ] CHK018 - Are requirements defined for what all participants see if the polling `GET /rooms/:code` call fails during the game (network error)? [Coverage, Exception Flow, Gap]
- [ ] CHK019 - Are requirements defined for the state of the canvas and guess history if a participant refreshes their browser mid-game? [Coverage, Spec §Assumptions]

## Edge Case Coverage

- [ ] CHK020 - Is the behaviour specified when the same participant submits the correct word a second time — is `isCorrect` set to false on the backend (per research.md Decision 6), and is this reflected in FR-012? [Edge Case, Spec §FR-012, research.md]
- [ ] CHK021 - Are requirements defined for a very long guess text (e.g., a paragraph) — is there a character limit on the guess input? [Edge Case, Gap]
- [ ] CHK022 - Are requirements defined for concurrent guess submissions from multiple guessers at the exact same moment — is the order of recording guaranteed? [Edge Case, Gap]

## Dependencies & Assumptions

- [ ] CHK023 - Is the assumption that canvas coordinates are always within 0–600 (x) and 0–400 (y) validated — are there requirements to clamp or reject out-of-bounds points? [Assumption, data-model.md]
- [ ] CHK024 - Is the assumption that `GuessForm` is a pre-existing stub component documented and its current interface (props) verified against what plan.md Phase D2 expects to add? [Dependency, plan.md §D2]
- [ ] CHK025 - Is the assumption that `Scoreboard` and `ResultPanel` are pre-existing stubs validated — do they currently accept no props, requiring a breaking props change? [Dependency, plan.md §D3, D4]

## Notes

- CHK011 is the most critical: the spec edge case says "second correct guess is recorded but score doesn't double" but FR-006 and FR-012 don't explicitly say `isCorrect` is set to `false` on the second attempt — research.md Decision 6 covers this but it should be traceable to the spec.
- CHK008 (scoreboard sort order) is a gap likely deferred to plan/implementation but worth noting.
- Items marked `[Gap]` have no corresponding requirement in the current spec artifacts.
