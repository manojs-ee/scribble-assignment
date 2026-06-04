# Implementation Plan: Room Setup & Lobby

**Branch**: `assignment` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking to the room model, improve join validation error messages, replace the manual lobby refresh with automatic ~2s polling, and gate the Start Game button to host-only with a 2-player minimum. All changes extend the existing starter files — no rewrites.

## Technical Context

**Language/Version**: TypeScript 5.x (backend via `tsx`, frontend via Vite)

**Primary Dependencies**: Express + Zod (backend), React 18 + React Router v6 (frontend) — all already in starter

**Storage**: In-memory `Map<string, Room>` on the backend — no persistence

**Testing**: Manual validation in two browser tabs per acceptance criteria

**Target Platform**: Local development — Node.js backend on port 3001, Vite frontend on port 5173

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Lobby polling latency ≤ 2s under local network conditions

**Constraints**: No new npm packages; no WebSockets; polling only; minimum change to starter

**Scale/Scope**: Small room (2–8 players), single room at a time per session

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| Brownfield-First | No file rewritten from scratch | ✅ All changes are additions/edits to existing files |
| Spec-Driven | Every change traceable to FR-001–FR-010 | ✅ Mapped below |
| Deterministic Game Rules | Word selection not in scope for this scenario | ✅ N/A |
| Polling Only | No WebSockets introduced | ✅ `setInterval` + `GET /rooms/:code` only |
| Incremental Validation | Each slice validated in two tabs before next | ✅ Planned per task |
| AI Review Discipline | All output reviewed before commit | ✅ In progress |

No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 findings
├── data-model.md        # Phase 1 entity model
├── contracts/           # API contracts
│   └── rooms.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Add hostId to Room + RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     # Set hostId on createRoom, expose in toRoomSnapshot
│   └── api/
│       ├── schemas.ts       # Add non-empty validation to room code
│       └── rooms.ts         # Improve join error messages

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           # Fix /bug URL suffix
│   ├── state/
│   │   └── roomStore.ts     # No changes needed for polling (handled in component)
│   └── pages/
│       └── LobbyPage.tsx    # Replace manual refresh with polling, host-only Start button
```

## Phase 0: Research

### Decision 1 — How to expose host identity to the frontend

**Decision**: Add `hostId: string` to the `Room` model and include it in `RoomSnapshot`. The frontend compares `room.hostId === participantId` from store state to determine if the viewer is host.

**Rationale**: Simplest approach — no extra endpoint, no extra state. `participantId` is already stored in `RoomStore` and returned at create/join time. One field addition to the model is sufficient.

**Alternatives considered**:
- Adding an `isHost` boolean to `Participant` — rejected, requires iterating participants to find the current viewer; more complex with no benefit.
- Separate `/rooms/:code/host` endpoint — rejected, adds unnecessary API surface.

### Decision 2 — Polling implementation in the frontend

**Decision**: Use `useEffect` + `setInterval` in `LobbyPage.tsx`. Call `roomStore.fetchRoom()` every 2000ms. Clear the interval on component unmount via the `useEffect` cleanup function.

**Rationale**: The existing `roomStore.fetchRoom()` already handles the API call and state update. No new infrastructure needed. `setInterval` cleanup on unmount satisfies FR-009 (polling stops on navigation).

**Alternatives considered**:
- Custom `usePolling` hook — rejected, premature abstraction for a single use case.
- Polling inside `RoomStore` class — rejected, store should not own lifecycle; component owns when polling is active.

### Decision 3 — Join error message specificity

**Decision**: Add Zod refinement to `roomCodeParamsSchema` to reject empty/whitespace codes with a 400 before the room lookup. Keep the existing 404 for not-found rooms but update the message to "Room not found — check your code and try again".

**Rationale**: Two distinct error paths (empty vs not-found) need two distinct messages. Zod handles the empty case at the schema layer; the service handles the not-found case.

**Alternatives considered**:
- Frontend-only validation — rejected, doesn't protect the API and misses direct API calls.

### Decision 4 — Fix the /bug URL suffix

**Decision**: Remove `/bug` from the `API_BASE_URL` in `frontend/src/services/api.ts:22`. Change to `http://localhost:3001`.

**Rationale**: This is a starter bug that blocks every API call. Fits the constitution's allowance for scoped starter bug fixes.

## Phase 1: Design

### Data Model

See [data-model.md](./data-model.md).

### API Contracts

See [contracts/rooms.md](./contracts/rooms.md).

## State Model Changes

### Backend — `Room` (game.ts)

```
Before:
  Room { code, status, participants, createdAt, updatedAt }

After:
  Room { code, status, participants, hostId, createdAt, updatedAt }
```

### Backend — `RoomSnapshot` (game.ts)

```
Before:
  RoomSnapshot { code, status, participants, availableWords, roles }

After:
  RoomSnapshot { code, status, participants, hostId, availableWords, roles }
```

### Backend — `RoomStatus` (game.ts)

No change for Scenario 1. Stays `"lobby"`. Will expand to `"playing" | "finished"` in Scenario 2.

### Frontend — `RoomSnapshot` (api.ts)

```
Before:
  RoomSnapshot { code, status, participants, availableWords, roles }

After:
  RoomSnapshot { code, status, participants, hostId, availableWords, roles }
```

### Frontend — `RoomStore` state

No structural change. `hostId` arrives via the room snapshot; host detection is `room.hostId === participantId` inline in the component.

## Data Flow

### Create Room (host assignment)

```
CreateRoomPage → roomStore.createRoom(name)
  → POST /rooms { playerName }
  → createRoom() sets room.hostId = participant.id
  → toRoomSnapshot() includes hostId
  ← RoomSessionResponse { participantId, room: { hostId, ... } }
  → roomStore.setRoomSession() stores participantId + room
  → navigate("/lobby")
```

### Lobby Polling

```
LobbyPage mounts
  → useEffect starts setInterval(2000)
    → every 2s: roomStore.fetchRoom()
      → GET /rooms/:code?participantId=...
      ← success: roomStore.setRoomSnapshot(room) → re-render
      ← failure: error swallowed, last known state kept, no UI change
                 interval continues unchanged (FR-010)
  → useEffect cleanup clears interval on unmount (FR-009)
```

### Host Detection (Start Button)

```
LobbyPage render:
  const isHost = room.hostId === participantId
  const canStart = isHost && room.participants.length >= 2

  {isHost && (
    <button disabled={!canStart}>Start Game</button>
  )}
```

### Join Validation

```
JoinRoomPage → roomStore.joinRoom(code, name)
  → POST /rooms/:code/join
  → schema validates code is non-empty → 400 if empty
  → joinRoom() looks up room → 404 if not found
  ← error.message displayed in form
```

## Implementation Sequence

Implement in this order — each step is independently testable:

1. **Fix API URL bug** — unblocks all other frontend work
2. **Add `hostId` to backend model + `createRoom`** — enables host tracking
3. **Expose `hostId` in `toRoomSnapshot`** — enables frontend to read host
4. **Add `hostId` to frontend `RoomSnapshot` type** — TypeScript alignment
5. **Improve join error messages** — schema + handler changes
6. **Replace manual refresh with polling in `LobbyPage`** — core lobby feature
7. **Add host-only Start Game button with 2-player guard** — navigates to `/game` as placeholder; Scenario 2 replaces with real start endpoint
8. **Validate in two browser tabs** — all acceptance criteria

## Testing Strategy

| Acceptance Criterion | How to Test |
|---|---|
| Creator is host | Create room, open DevTools, check `room.hostId === participantId` in store |
| Host label shown in lobby | Create room, confirm host indicator visible |
| Invalid code → clear error | Submit empty code, submit non-existent code — check messages |
| Polling auto-updates | Tab 1 in lobby, Tab 2 joins — Tab 1 updates within 2s without click |
| Polling stops on navigate | Navigate away from lobby, check Network tab — no more polling requests |
| Start button host-only | Tab 1 (host) sees button, Tab 2 (joiner) does not |
| Start button disabled at 1 player | Host alone — button visible but disabled |
| Start button enabled at 2 players | Both tabs in lobby — button becomes enabled within 2s |
| Multi-room isolation | Create two rooms — confirm separate participant lists |

## Risks

| Risk | Mitigation |
|---|---|
| `participantId` lost on page refresh | Acceptable for this lab — no session persistence required |
| Polling fires after unmount (stale closure) | `useEffect` cleanup clears interval — standard React pattern |
| Race condition: poll overlaps with join | `fetchRoom` is idempotent GET — safe to overlap |
