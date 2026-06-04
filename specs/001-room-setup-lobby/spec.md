# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-04

**Status**: Draft

## User Scenarios & Testing

### User Story 1 — Room Creation & Host Assignment (Priority: P1)

A player opens the app, enters their name, and creates a room. They land in the lobby immediately as the host. The room is assigned a unique 4-character code they can share with others.

**Why this priority**: Everything else depends on a room existing with a host. No other story is testable without this.

**Independent Test**: Open one browser tab, create a room, confirm you land in the lobby and are identified as the host.

**Acceptance Scenarios**:

1. **Given** a player submits the Create Room form, **When** the request succeeds, **Then** a room is created with a unique code, the creator is recorded as the host, and the player is navigated to the lobby.
2. **Given** a room is created, **When** the lobby loads, **Then** the host player is clearly identified (badge, label, or visual indicator) in the participant list.
3. **Given** two rooms are created simultaneously, **When** each is viewed, **Then** their participant lists, host assignments, and state are fully isolated from each other.

---

### User Story 2 — Join Room by Code (Priority: P2)

A second player enters the room code shared by the host and joins the room. Invalid or empty codes are rejected with a clear, specific error message — not a generic failure.

**Why this priority**: The game requires at least 2 players. Join validation is the gate to multi-player play.

**Independent Test**: Open a second browser tab, enter a valid room code, confirm you land in the same lobby. Then try an invalid code and confirm a clear error appears.

**Acceptance Scenarios**:

1. **Given** a player enters a valid room code, **When** they submit the Join Room form, **Then** they are added to the room's participant list and navigated to the lobby.
2. **Given** a player submits an empty room code, **When** the form is submitted, **Then** a clear error message is shown (e.g. "Room code is required") and the player stays on the Join screen.
3. **Given** a player enters a code for a room that does not exist, **When** the form is submitted, **Then** a clear error message is shown (e.g. "Room not found — check your code and try again") and the player stays on the Join screen.
4. **Given** two separate rooms exist, **When** a player joins room A, **Then** they do not appear in room B's participant list.

---

### User Story 3 — Automatic Lobby Polling (Priority: P3)

The lobby screen automatically refreshes the participant list every ~2 seconds without any manual action. When a new player joins, all existing players in the lobby see the updated list within ~2 seconds.

**Why this priority**: Builds on US1 and US2. Polling is what makes the lobby feel live.

**Independent Test**: Open two tabs in the same room. Join from tab 2. Within 2 seconds, tab 1's participant list updates automatically without any button press.

**Acceptance Scenarios**:

1. **Given** a player is on the lobby screen, **When** 2 seconds pass, **Then** the frontend automatically calls `GET /rooms/:code` to refresh state — no user action required.
2. **Given** a new player joins the room, **When** the polling interval fires on any existing player's lobby, **Then** the new participant appears in the list within ~2 seconds.
3. **Given** a player leaves the lobby screen, **When** they navigate away, **Then** polling stops (no background requests continue).
4. **Given** a poll request fails, **When** the error occurs, **Then** polling continues on the next interval — a single failure does not break the loop.

---

### User Story 4 — Host-Only Start Game (Priority: P4)

The Start Game button is visible only to the host. It is disabled until at least 2 players are present in the room. Non-host players see no Start Game button.

**Why this priority**: Depends on US1 (host identity) and US3 (polling keeps count live). Gate before Scenario 2.

**Independent Test**: With 1 player (host only), confirm Start Game is disabled. Join a second tab. Within 2 seconds (via polling), confirm Start Game becomes enabled for the host only. Confirm the second tab has no Start Game button.

**Acceptance Scenarios**:

1. **Given** the current player is the host, **When** there is only 1 participant, **Then** the Start Game button is visible but disabled.
2. **Given** the current player is the host, **When** there are 2 or more participants, **Then** the Start Game button is visible and enabled.
3. **Given** the current player is not the host, **When** they are on the lobby screen, **Then** no Start Game button is visible.
4. **Given** the host clicks Start Game with ≥2 players, **When** the action is triggered, **Then** the player is navigated to `/game` (placeholder navigation — Scenario 2 replaces this with a real start endpoint).

---

### Edge Cases

- What happens when a player joins a room whose code has correct format but does not exist? → Clear "Room not found" error, not a generic 404.
- What happens if polling fails on every attempt? → The lobby keeps the last known state and shows nothing to the user. Each failed poll is ignored silently; the next interval retries. The lobby does not crash or freeze.
- What happens if the host refreshes the page? → Host identity is re-derived from the participant ID issued at room creation, matched against the host recorded in the room snapshot.
- What happens with two rooms that happen to share participant names? → Rooms are isolated by code; participant identity is by `id` (UUID), not name.
- What happens if a player tries to join a room they are already in? → A new participant entry is created — the backend has no duplicate-join detection. This is acceptable for this lab (deduplication is out of scope).
- What happens if a poll response takes longer than 2 seconds? → The interval fires independently of response time. Overlapping requests are safe — `GET /rooms/:code` is idempotent. The last response to arrive wins.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST record the room creator as the host at the moment the room is created.
- **FR-002**: The host identity MUST be persisted in the room's server-side state and returned in every room snapshot.
- **FR-003**: The lobby MUST poll `GET /rooms/:code` automatically at ~2-second intervals while the lobby screen is mounted.
- **FR-004**: The Start Game button MUST be rendered only for the host participant.
- **FR-005**: The Start Game button MUST be disabled when fewer than 2 participants are present.
- **FR-006**: The join form MUST reject an empty or whitespace-only room code with the message "Room code is required".
- **FR-007**: The join form MUST reject a code for a non-existent room with the message "Room not found — check your code and try again".
- **FR-008**: Each room MUST maintain fully isolated participant state — joining room A MUST NOT affect room B.
- **FR-009**: Polling MUST stop when the player navigates away from the lobby screen.
- **FR-010**: A single failed poll MUST NOT terminate the polling loop.

### Key Entities

- **Room**: Unique code, participant list, host identifier, status (`lobby`), timestamps.
- **Participant**: UUID, display name, joined-at timestamp.
- **RoomSnapshot**: The data returned to the client per poll — includes host identity so any player can determine whether they are the host without extra state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can create a room and land in the lobby in under 3 seconds on a local network.
- **SC-002**: A second player joining from another tab appears in all existing players' lobby views within 2 seconds, without any manual action.
- **SC-003**: 100% of join attempts with an empty or non-existent code display a specific, human-readable error message — no raw error codes or generic failures shown to the user.
- **SC-004**: The Start Game button state (visible/hidden, enabled/disabled) is always consistent with the current player's host status and participant count, as updated by polling. Falsifiable test: join as non-host and confirm no button renders; join as host with 1 player and confirm button is disabled; add second player and confirm button enables within 2 seconds.
- **SC-005**: Two rooms created in the same session share no participant state — verified by joining each independently and confirming separate lists.

## Assumptions

- Host is defined as the first participant to create the room (the creator). Host identity does not transfer if the creator leaves (out of scope).
- Polling reuses the existing `GET /rooms/:code` endpoint — no new endpoint is needed for the lobby refresh.
- Player name validation (trim, reject empty) is deferred to Scenario 2. This spec accepts any name at join/create time.
- The `participantId` returned at create/join time is stored in frontend state and used to determine if the current viewer is the host.
- Room codes are case-insensitive on input but stored in uppercase — the starter already handles this.
- The manual "Refresh Room" button in the starter lobby will be replaced by automatic polling; the button itself can be removed.

## Clarifications

### Session 2026-06-04

- Q: When a poll fails, what should the lobby UI show? → A: Keep last known state, show nothing — silently retry on next interval.
- Q: In Scenario 1, when the host clicks Start Game, what should happen? → A: Navigate to `/game` (placeholder) — Scenario 2 wires the real start call.
