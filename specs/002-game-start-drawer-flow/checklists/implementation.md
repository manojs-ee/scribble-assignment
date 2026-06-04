# Implementation Requirements Checklist: Game Start & Drawer Flow

**Purpose**: Validate that requirements in spec, clarifications, plan, and contracts are complete, clear, consistent, and measurable before task generation
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/api.md](../contracts/api.md)

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for what happens when `POST /rooms/:code/start` is called with a room that has fewer than 2 participants (below the lobby minimum)? [Completeness, Gap]
- [ ] CHK002 - Is the HTTP status code for a duplicate start call (room already "playing") explicitly specified? [Completeness, Spec §FR-002]
- [ ] CHK003 - Are requirements defined for the `POST /rooms/:code/start` response body shape — specifically what fields are returned to the caller? [Completeness, contracts/api.md]
- [ ] CHK004 - Is the behaviour of the `availableWords` and `roles` fields in `RoomSnapshot` after game start explicitly documented (kept, removed, or deprecated)? [Completeness, data-model.md]
- [ ] CHK005 - Are requirements defined for what the LobbyPage should show if the `POST /start` call fails (network error, 409, etc.)? [Completeness, Spec §C1, Gap]
- [ ] CHK006 - Are GamePage polling cleanup requirements specified (what happens on component unmount or navigation away)? [Completeness, Spec §FR-012]

## Requirement Clarity

- [ ] CHK007 - Is "omitted from the response" (vs `null` vs `""`) for the `word` field precisely defined for non-drawer participants? [Clarity, contracts/api.md]
- [ ] CHK008 - Is the phrase "approximately every 2 seconds" in FR-012 and SC-002 sufficiently precise for implementation, or does it need a specific tolerance (e.g., ±500ms)? [Clarity, Spec §FR-012]
- [ ] CHK009 - Is "trim names" defined precisely — does it mean only leading/trailing whitespace, or also internal runs of whitespace? [Clarity, Spec §FR-009, FR-010]
- [ ] CHK010 - Is the error message text for empty name validation fixed (e.g., "Name is required") or is any non-empty message acceptable? [Clarity, Spec §FR-009, FR-010]
- [ ] CHK011 - Is "displayed prominently" for the drawer's secret word (Spec §FR-007) quantified with any layout or visual hierarchy requirement? [Clarity, Ambiguity]
- [ ] CHK012 - Is the `wordIndex` computation rule (`roomCreationCount % STARTER_WORDS.length`) stated in the spec or only in research.md/data-model.md? [Clarity, Traceability]

## Requirement Consistency

- [ ] CHK013 - Does the spec's `RoomSnapshot` entity definition (word only for drawer) align exactly with the contracts/api.md description of when `word` is included vs omitted? [Consistency, Spec §Key Entities, contracts/api.md]
- [ ] CHK014 - Does FR-011 (LobbyPage calls `POST /start`) align with the plan's Phase C1 description of the button handler — specifically that navigation only occurs on success, not on fire-and-forget? [Consistency, Spec §FR-011, plan.md §C1]
- [ ] CHK015 - Are the `RoomStatus` values used in the spec ("lobby" | "playing") consistent with those in data-model.md and contracts/api.md? [Consistency]
- [ ] CHK016 - Is the `participantId` returned by `POST /rooms/:code/start` specified consistently across the spec, clarifications, and contracts (it should be the drawer/hostId)? [Consistency, contracts/api.md]

## Acceptance Criteria Quality

- [ ] CHK017 - Is SC-003 ("non-drawer participants never see the secret word in the network response") verifiable by inspecting the raw HTTP response, or does it depend on frontend behaviour? [Measurability, Spec §SC-003]
- [ ] CHK018 - Is SC-005 ("100% reproducible across server restarts") testable with the starter word list and creation counter rule, and is the exact reproduction procedure described? [Measurability, Spec §SC-005]
- [ ] CHK019 - Is SC-001 ("single button click, no additional steps") a testable criterion or does it describe a UX quality that needs more precision? [Measurability, Spec §SC-001]

## Scenario Coverage

- [ ] CHK020 - Are requirements defined for the guesser's GamePage when it first loads after the game has started (does it need to poll before showing anything, or does the LobbyPage polling handle the transition)? [Coverage, Gap]
- [ ] CHK021 - Is the transition from lobby polling to game polling specified — does LobbyPage stop its interval before navigating, or does it rely on unmount cleanup? [Coverage, Spec §FR-012, Gap]
- [ ] CHK022 - Are requirements defined for what a late-joining participant (joined after game started) sees on the GamePage? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK023 - Is the behaviour specified when `STARTER_WORDS` is empty and `wordIndex` lookup would fail? [Edge Case, Spec §Assumptions]
- [ ] CHK024 - Is the behaviour defined if `roomStore.fetchRoom()` fails during GamePage polling (network error, 404 room gone)? [Edge Case, Gap]
- [ ] CHK025 - Is there a requirement addressing what happens if the host navigates away before clicking Start (LobbyPage unmounts while polling is active)? [Edge Case, Spec §Edge Cases]

## Dependencies & Assumptions

- [ ] CHK026 - Is the assumption that `participantId` is always present in `roomStore` state when GamePage mounts validated — i.e., is there a guard if it's null? [Assumption, Spec §Assumptions]
- [ ] CHK027 - Is the assumption that `STARTER_WORDS` is a fixed, non-empty constant (not dynamically loaded) documented and reflected in the spec's scope boundaries? [Assumption, Spec §Assumptions]
- [ ] CHK028 - Is the backwards-compatibility of the existing `fetchRoom()` call (which already passes `participantId`) to the updated `toRoomSnapshot` logic documented — i.e., no breaking change to the existing polling in LobbyPage? [Dependency, plan.md §A2]

## Notes

- Items marked `[Gap]` indicate requirements that appear missing or underspecified in the current artifacts.
- Items marked `[Ambiguity]` indicate requirements that exist but may be interpreted differently by different implementers.
- CHK012 in particular: the determinism rule is critical per the constitution but currently lives only in research.md — it should be traceable to the spec.
