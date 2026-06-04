# Implementation Requirements Checklist: Result State & Restart Flow

**Purpose**: Validate that requirements in spec, clarifications, plan, and contracts are complete, clear, consistent, and measurable before task generation
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/api.md](../contracts/api.md)

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for what happens to the "Exit Game" button on the results screen — is it still shown, hidden, or repurposed? [Completeness, Gap]
- [ ] CHK002 - Are requirements defined for the results screen display when NO correct guess has been made (e.g., game somehow reaches "finished" without a winner)? [Completeness, Gap]
- [ ] CHK003 - Is the requirement for `POST /rooms/:code/restart` returning success on an already-lobby room (idempotency) explicitly stated in the spec or only in plan.md? [Completeness, Spec §FR-009, plan.md]
- [ ] CHK004 - Are requirements defined for what non-host players see between clicking "Play Again" (host action) and the lobby being detected via polling — is there a transitional state? [Completeness, Gap]
- [ ] CHK005 - Is there a requirement specifying whether the secret word is shown on the results screen to all players, and if so, what is the source (winning guess text vs stored word)? [Completeness, Spec §FR-004]

## Requirement Clarity

- [ ] CHK006 - Is "results screen" defined precisely enough — does it replace the entire GamePage content, or only the canvas/guess area? [Clarity, Spec §FR-003, Clarifications]
- [ ] CHK007 - Is the "waiting for the host to start a new game" message text fixed (exact wording) or is any non-empty message acceptable? [Clarity, Spec §FR-006]
- [ ] CHK008 - Is FR-008 ("all clients MUST detect 'lobby' status via polling and navigate back to lobby") clear about which page/component is responsible for detecting this — GamePage, or a shared hook? [Clarity, Spec §FR-008, plan.md §C2]
- [ ] CHK009 - Does FR-009 (restart idempotency) apply to all room statuses ("playing" and "finished") or only "finished"? The spec says "already in lobby" but the plan says nothing about calling restart on a "playing" room. [Clarity, Spec §FR-009]

## Requirement Consistency

- [ ] CHK010 - Is the state transition in data-model.md (`restartGame` clears `wordIndex: unchanged`) consistent with the spec assumption that `wordIndex` is set at room creation and stays fixed? [Consistency, Spec §Assumptions, data-model.md]
- [ ] CHK011 - Does FR-001 ("winnerId is never overwritten") align with the edge case ("second simultaneous correct guess → 409") and Clarification Q2? All three say the same thing but from different angles — are they internally consistent? [Consistency, Spec §FR-001, Edge Cases, Clarifications]
- [ ] CHK012 - Does the `RoomStatus` extension to include `"finished"` in the frontend types align with the existing `"lobby" | "playing"` guard logic in LobbyPage (which navigates to `/game` when `status === "playing"`)? Is there a risk LobbyPage navigates to `/game` from a "finished" room? [Consistency, Spec §FR-008, plan.md §C2]

## Acceptance Criteria Quality

- [ ] CHK013 - Is SC-001 ("results screen visible within ≤2 seconds of correct guess") verifiable by observing two browser tabs — can a human reliably measure this without tooling? [Measurability, Spec §SC-001]
- [ ] CHK014 - Is SC-005 ("lobby shows same participant list with no leftover state after restart") testable by visual inspection of the lobby page alone, or does it require inspecting the network response? [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK015 - Are requirements defined for what the drawer sees on the results screen — specifically, does the drawer see who won and the secret word the same way guessers do? [Coverage, Spec §US1 Acceptance Scenario 4]
- [ ] CHK016 - Are requirements defined for the game state if a player joins mid-"finished" (enters the room code after the game is over)? [Coverage, Spec §Edge Cases, Gap]
- [ ] CHK017 - Are requirements defined for what happens if the host clicks "Play Again" and the restart call fails (network error)? [Coverage, Exception Flow, Gap]

## Edge Case Coverage

- [ ] CHK018 - Is the behaviour specified when `POST /rooms/:code/restart` is called on a room in "playing" status (not "finished")? The spec only covers "lobby" idempotency and "finished" → "lobby" — "playing" → restart is not addressed. [Edge Case, Spec §FR-009, Gap]
- [ ] CHK019 - Are requirements defined for the polling behaviour during the results screen — does GamePage continue to poll, or does it stop once "finished" is detected? [Edge Case, Gap]

## Dependencies & Assumptions

- [ ] CHK020 - Is the assumption that the winning guess text is used to display the secret word on the results screen (plan.md §C1) traceable to a spec requirement, or is it only in the plan? [Assumption, plan.md §C1, Spec §FR-004]
- [ ] CHK021 - Is the assumption that "only the host can trigger restart, enforced frontend-only" (Spec §Assumptions) validated — is there a risk that non-host clients could call the endpoint directly and bypass this? [Assumption, Spec §Assumptions, Spec §FR-007]
- [ ] CHK022 - Is the dependency on LobbyPage's existing `status === "playing"` navigation logic documented as a risk — specifically that GamePage must navigate to `/lobby` on "lobby" detection rather than relying on LobbyPage to pull clients back? [Dependency, plan.md §C2]

## Notes

- CHK005 and CHK020 are closely related: the plan uses winning-guess-text as the source of the secret word for the results screen, but this is a plan-level decision not explicitly required in the spec. If the word display requirement is in scope, it should be in FR-004.
- CHK012 is the most architecturally significant: LobbyPage navigating to `/game` when `status === "playing"` must not fire when the room is "finished" — if GamePage sends clients back to `/lobby` after restart, and the room briefly shows "playing" during a future game, LobbyPage must handle all statuses correctly.
- CHK018 is a genuine gap: calling restart on a "playing" room is not addressed.
