# Feature Specification: Result State & Restart Flow

**Feature Branch**: `004-result-restart-flow`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 4: Result State and Restart Flow. After a correct guess, the game transitions to a 'finished' status. All players see a results screen showing who won (the correct guesser), the secret word, and the final scoreboard. The host sees a 'Play Again' button that resets the room back to lobby state (clears the canvas, guesses, scores, and word) so a new game can begin with the same players. Non-host players see a message that the host can restart. No new rounds with different drawers — restart means the same host becomes drawer again."

## Clarifications

### Session 2026-06-04

- Q: Should the results screen be a new route or a display mode within GamePage? → A: GamePage detects `room.status === "finished"` and renders results view inline — no new route or page component needed.
- Q: Can `winnerId` be overwritten after the first correct guess? → A: No — `winnerId` is set exactly once on the first correct guess that transitions the room to "finished"; `submitGuess()` returns 409 when room status is "finished".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game Ends and Results Screen Appears (Priority: P1)

When a guesser submits the correct answer, the game automatically transitions to a "finished" state. All players — the drawer and all guessers — are automatically redirected to a results screen. The screen shows who guessed correctly (the winner), the secret word that was being drawn, and the final scoreboard with all participants' scores.

**Why this priority**: Without a results screen the game has no conclusion. Players have no feedback on who won and no path to play again. This is the minimum viable conclusion to a game round.

**Independent Test**: Two tabs, start a game. Tab 2 (guesser) submits the correct word. Both tabs automatically navigate to the results screen within one polling cycle (≤2s). The results screen shows: the winner's name, the secret word, and the final scoreboard. Both tabs show identical information.

**Acceptance Scenarios**:

1. **Given** a game is in "playing" status, **When** a guesser submits the correct word, **Then** the room status transitions to "finished" and the correct guesser is recorded as the winner.
2. **Given** the room status has changed to "finished", **When** any player's polling cycle fires, **Then** they are automatically navigated to the results screen.
3. **Given** the results screen is shown, **Then** it displays the winner's name, the secret word, and the final scoreboard showing all participants' scores.
4. **Given** the results screen is shown, **Then** the drawer also sees the same results screen (not the drawing canvas).

---

### User Story 2 - Host Restarts the Game (Priority: P2)

The host sees a "Play Again" button on the results screen. Clicking it resets the room back to lobby state: all players remain in the room, but the canvas, guesses, scores, and word are cleared. The room is ready for a new game to be started from the lobby.

**Why this priority**: Without restart, the game is single-use. The restart flow completes the game loop and allows continuous play with the same group.

**Independent Test**: After the results screen appears, Tab 1 (host) clicks "Play Again". Both tabs navigate back to the lobby. The participant list is unchanged. A new game can be started from the lobby by clicking Start Game again.

**Acceptance Scenarios**:

1. **Given** the results screen is shown and the current user is the host, **When** the host clicks "Play Again", **Then** the room resets to "lobby" status with all participants retained.
2. **Given** the room has been reset to lobby, **Then** strokes, guesses, scores, and the current word are all cleared.
3. **Given** the room has been reset to lobby, **When** any player's polling cycle fires, **Then** they are navigated back to the lobby page.
4. **Given** the results screen is shown and the current user is NOT the host, **Then** a message is displayed: "Waiting for the host to start a new game" (no Play Again button).

---

### Edge Cases

- What if two guessers submit the correct answer simultaneously? → The first to be recorded by the server triggers the "finished" transition and is set as the winner. The second call to `submitGuess()` sees the room is already "finished" and returns 409 — the second guess is not recorded.
- What if the host leaves (closes their tab) before clicking Play Again? → Non-host players remain on the results screen indefinitely; no auto-reset occurs (no disconnect detection in scope).
- What if Play Again is clicked multiple times rapidly? → The server rejects duplicate resets — if the room is already in "lobby" status, the call is a no-op or returns an appropriate response.
- What if a player joins the room while it is in "finished" status? → Out of scope; no join-mid-game handling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a correct guess is submitted, the system MUST transition the room status from "playing" to "finished" and record the winning participant's ID (`winnerId`). This transition happens exactly once — `winnerId` is never overwritten. Subsequent calls to `POST /rooms/:code/guess` on a "finished" room MUST return 409.
- **FR-002**: The `GET /rooms/:code` polling response MUST include the room's "finished" status and the winner's participant ID so all clients can detect the game end.
- **FR-003**: When a client detects room status "finished" via polling, the GamePage MUST switch to a results display mode inline — no navigation to a new route is required.
- **FR-004**: The results screen MUST display: the winner's name, the secret word, and the final scoreboard (all participants and their scores).
- **FR-005**: The results screen MUST show a "Play Again" button to the host only.
- **FR-006**: Non-host players on the results screen MUST see a message indicating the host can start a new game (no Play Again button).
- **FR-007**: The system MUST expose a `POST /rooms/:code/restart` endpoint that resets the room to "lobby" status, clearing strokes, guesses, scores, word, drawerId, and winnerId.
- **FR-008**: After a successful restart, all clients MUST detect the "lobby" status via polling and navigate back to the lobby page.
- **FR-009**: The restart endpoint MUST be idempotent for rooms already in "lobby" status — calling it on a lobby room MUST return success without error.

### Key Entities

- **Room** (extended): Adds `winnerId?: string` — set to the winning participant's ID when status transitions to "finished"; cleared on restart.
- **RoomStatus** (extended): Adds `"finished"` as a third possible value alongside `"lobby"` and `"playing"`.
- **RoomSnapshot** (extended): Exposes `winnerId?: string` so clients can display the winner's name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results screen within one polling cycle (≤ 2 seconds) of the correct guess being submitted.
- **SC-002**: The results screen correctly identifies the winner, displays the secret word, and shows accurate final scores for all players.
- **SC-003**: After the host clicks "Play Again", all players are back on the lobby page within one polling cycle (≤ 2 seconds).
- **SC-004**: Non-host players on the results screen never see the "Play Again" button.
- **SC-005**: After a restart, the lobby shows the same participant list with no leftover scores, guesses, or drawing state.

## Assumptions

- The "finished" transition is triggered server-side when a correct guess is submitted via `POST /rooms/:code/guess` — no separate endpoint is needed to trigger game end.
- Only one winner is possible per game: the first participant to submit a correct guess (as recorded by the server). If no correct guess is submitted, the game never reaches "finished".
- The winner's name is resolved on the frontend by looking up `winnerId` in `room.participants`.
- The results screen is rendered inline within the existing GamePage by detecting `room.status === "finished"` — no new route or page component is introduced.
- After restart, the room returns to exactly the same state as a freshly started lobby with the original participants — no score history is preserved across rounds.
- Only the host can trigger a restart; this is enforced on the frontend only (checking `hostId === participantId`). No backend auth check is required for this scenario.
- Players who are already on the GamePage when the game ends will transition to the results view via the existing polling mechanism — no push notification needed.
