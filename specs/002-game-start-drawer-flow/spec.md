# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 2: Game Start and Drawer Flow. When the host clicks Start Game in the lobby, POST /rooms/:code/start is called. This transitions room status from 'lobby' to 'playing', assigns the drawer (the host / first participant via room.hostId), and picks the secret word deterministically (using an index based on room creation count, never Math.random()). The RoomSnapshot is updated to include drawerId, status ('playing'), and word — but word is only returned to the drawer participant. On the frontend, GamePage shows the drawer their word and displays 'You are the drawer'. All other players see 'You are guessing'. Player name validation: trim names on create and join forms; reject empty or whitespace-only names with a clear error message before submitting."

## Clarifications

### Session 2026-06-04

- Q: How should the backend filter the `word` field — how does it know which participant is requesting? → A: Add `?participantId=<id>` query param to `GET /rooms/:code`; backend returns `word` only when `participantId === room.drawerId`.
- Q: How does GamePage receive the room code and participant ID it needs to poll? → A: GamePage reads `roomCode` and `participantId` from the existing frontend `roomStore` — no route params needed.
- Q: Does GamePage poll `GET /rooms/:code` on an interval, or render a static snapshot? → A: GamePage polls `GET /rooms/:code?participantId=<id>` every ~2 seconds, same pattern as LobbyPage.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts the Game (Priority: P1)

The host is in the lobby with at least one other player and clicks "Start Game". The game transitions to the playing state. The host becomes the drawer. A secret word is deterministically selected and shown only to the host/drawer. All other players see their role as "You are guessing" without seeing the word.

**Why this priority**: This is the central flow of the feature — without it no game can begin. All other stories depend on it.

**Independent Test**: Open two browser tabs with the same room code. Tab 1 (host) sees "Start Game" button enabled. Click it. Tab 1 transitions to the game page and sees "You are the drawer" plus the secret word. Tab 2 sees "You are guessing" and no word. Full value is delivered by this story alone.

**Acceptance Scenarios**:

1. **Given** a room is in lobby state with at least 2 participants, **When** the host clicks "Start Game", **Then** the room status changes to "playing", the host becomes the drawer, and a secret word is assigned deterministically.
2. **Given** the game has started, **When** the drawer's game page loads, **Then** the drawer sees "You are the drawer" and the secret word displayed prominently.
3. **Given** the game has started, **When** a non-drawer participant's game page loads, **Then** they see "You are guessing" and the secret word is not displayed or accessible.
4. **Given** the game has started, **When** the host calls start again (duplicate request), **Then** the server rejects it with an appropriate error (room already in "playing" state).

---

### User Story 2 - Player Name Validation on Create & Join (Priority: P2)

When a player attempts to create a room or join one, their entered name is trimmed of leading/trailing whitespace. If the trimmed name is empty or whitespace-only, the form rejects the submission with a clear inline error message without making a network request.

**Why this priority**: Invalid names degrade game experience (blank name badges) and pollute the participant list. Validation must be in place before game start so every participant has a real name.

**Independent Test**: On the Create Room or Join Room form, enter spaces only as the name and click submit. An error message appears inline, no API call is made. Valid names (including names with internal spaces) are accepted. Delivers standalone value by preventing bad data.

**Acceptance Scenarios**:

1. **Given** the Create Room form, **When** the player enters only spaces in the name field and submits, **Then** an error message "Name is required" (or similar) appears and no API call is made.
2. **Given** the Join Room form, **When** the player enters only spaces in the name field and submits, **Then** an error message appears and no API call is made.
3. **Given** either form, **When** the player enters a name with leading/trailing spaces, **Then** the name is trimmed before submission and the trimmed value is used.
4. **Given** either form, **When** the player enters a valid non-empty name, **Then** submission proceeds normally.

---

### User Story 3 - Deterministic Word Selection (Priority: P3)

The secret word chosen when a game starts is always the same for a given room creation count. If two testers independently start games in the first and second rooms ever created, they always get the same respective words, making grader validation reproducible.

**Why this priority**: Determinism is a constitution requirement and a grader expectation. Non-deterministic selection would make automated validation impossible.

**Independent Test**: Restart the server. Create two rooms and start each. Record the words. Restart the server again. Repeat. Both runs produce the same two words in the same order.

**Acceptance Scenarios**:

1. **Given** the server has created N rooms so far, **When** a game starts in room N+1, **Then** the word is `STARTER_WORDS[(N+1) % STARTER_WORDS.length]` (or equivalent fixed index rule).
2. **Given** the same room creation sequence, **When** the server is restarted and the sequence replayed, **Then** the same words are selected in the same order.

---

### Edge Cases

- What happens when "Start Game" is called on a room already in "playing" state? → Server returns an error; the button should be unavailable once the game is playing.
- What happens if the host leaves before starting? → Out of scope for this scenario (no disconnect detection); the room persists as-is.
- What happens if a participant's name is valid on the backend but was not trimmed by the frontend? → Backend does not re-trim; frontend is the enforcement point for this scenario.
- What happens if the word list is empty? → Treated as a configuration error; behaviour is undefined and out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a `POST /rooms/:code/start` endpoint that transitions a room from "lobby" to "playing" status.
- **FR-002**: Only a room in "lobby" status MAY be started; attempting to start a "playing" room MUST return an error response.
- **FR-003**: On game start, the system MUST assign the drawer role to the host participant (identified by `room.hostId`).
- **FR-004**: On game start, the system MUST select the secret word deterministically using a fixed index rule based on total room creation count (e.g., `STARTER_WORDS[creationCount % STARTER_WORDS.length]`); `Math.random()` MUST NOT be used.
- **FR-005**: The room snapshot returned by `GET /rooms/:code` MUST include `drawerId` and `status` fields after the game has started.
- **FR-006**: The `word` field in the room snapshot MUST only be returned to the drawer participant. The frontend MUST pass `?participantId=<id>` as a query parameter on every `GET /rooms/:code` poll; the backend includes `word` in the response only when `participantId` matches `room.drawerId`. All other participants receive the snapshot without the `word` field.
- **FR-007**: The frontend game page MUST display "You are the drawer" and the secret word to the drawer.
- **FR-008**: The frontend game page MUST display "You are guessing" to all non-drawer participants, with no word visible.
- **FR-009**: The Create Room form MUST trim the player name and reject empty or whitespace-only names with an inline error message before making any network request.
- **FR-010**: The Join Room form MUST trim the player name and reject empty or whitespace-only names with an inline error message before making any network request.
- **FR-011**: The LobbyPage "Start Game" button MUST call `POST /rooms/:code/start` rather than navigate directly; successful response navigates to the game page.
- **FR-012**: The GamePage MUST poll `GET /rooms/:code?participantId=<id>` approximately every 2 seconds using a `setInterval`/`useEffect` pattern matching LobbyPage, and clean up the interval on unmount.

### Key Entities

- **Room**: Has `status` ("lobby" | "playing"), `hostId`, `drawerId` (set on game start), `currentWord` (set on game start), and `creationIndex` (a server-maintained counter used for word selection).
- **RoomSnapshot**: Public view of Room — includes `status`, `drawerId`; includes `word` only when the `participantId` query parameter on `GET /rooms/:code` matches `drawerId`.
- **Participant**: Has `id` and `name` (trimmed, non-empty). The participant whose `id` matches `room.hostId` is the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The host can start a game from the lobby in a single button click with no additional steps.
- **SC-002**: The drawer sees their secret word within one polling cycle (≤ 2 seconds) of the game starting.
- **SC-003**: Non-drawer participants never see the secret word in the game page UI or in the network response they receive.
- **SC-004**: Submitting an empty or whitespace-only name on either form always produces a visible error message and never triggers a network request.
- **SC-005**: Given the same room creation sequence, word selection is 100% reproducible across server restarts.

## Assumptions

- The existing `GET /rooms/:code` endpoint is reused for polling during the game; no new polling endpoint is needed. GamePage polls it every ~2 seconds (same pattern as LobbyPage), passing `?participantId=<id>` so the backend can filter the word field. GamePage reads `roomCode` and `participantId` from the existing frontend `roomStore` on mount — no route parameters are required.
- The participant's own `id` is available in frontend state (via `roomStore`) and is passed as `?participantId=<id>` on every `GET /rooms/:code` poll so the backend can filter the `word` field appropriately.
- The word list (`STARTER_WORDS`) already exists in `backend/src/seed/starterData.ts` and is non-empty.
- A room creation counter is added to the backend in-memory store (e.g., a module-level integer incremented each time a room is created) to support deterministic word selection.
- Only one round is in scope; drawer rotation, timers, and multiple rounds are out of scope.
- The backend does not re-validate or re-trim player names; the frontend is the sole enforcement point for name trimming in this scenario.
- The `POST /rooms/:code/start` endpoint does not require authentication; any caller can invoke it (the host check is by `hostId`, not a session).
