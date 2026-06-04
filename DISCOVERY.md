# Discovery Notes

Upfront codebase inspection before any implementation. Read all starter files before writing code.

## Incomplete Behaviors Found

### 1. No host tracking on room creation
The `Room` model has no host field. The `createRoom` function in `roomStore.ts` creates a participant but does not mark them as host. The `RoomSnapshot` returned to the client has no host identifier. There is no way for the frontend to know who the host is.

**File**: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`

### 2. Lobby uses manual refresh — no polling
`LobbyPage.tsx` has a "Refresh Room" button that calls `roomStore.fetchRoom()` on click. There is no automatic polling. Players joining from another tab are invisible until someone manually clicks refresh.

**File**: `frontend/src/pages/LobbyPage.tsx`

### 3. Start Game button is unguarded
The Start Game button in `LobbyPage.tsx` is visible and clickable by all players regardless of host status. It navigates directly to `/game` with no server-side start action, no host check, and no minimum player count check.

**File**: `frontend/src/pages/LobbyPage.tsx`

### 4. Join validation returns a generic error
`POST /rooms/:code/join` returns `404 "Unable to join room"` for any invalid code. The frontend catches this and shows the raw message. There is no distinction between an empty code and a non-existent room. Empty codes are not validated at the schema level — `joinRoomSchema` makes `playerName` optional but does not validate the code field beyond it being a string.

**File**: `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/pages/JoinRoomPage.tsx`

### 5. Game screen is entirely placeholder
`GamePage.tsx` has no interactive canvas, no guess submission wired up, no score display, no result state, no drawer/guesser role awareness, and no polling. `GuessForm`, `Scoreboard`, and `ResultPanel` components exist but are empty shells.

**File**: `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`

### 6. API base URL has a bug in the starter
`frontend/src/services/api.ts` line 22 sets the base URL to `http://localhost:3001/bug` — the `/bug` suffix is clearly unintentional and will break every API call in a clean environment.

**File**: `frontend/src/services/api.ts:22`

---

## Assumptions

### 1. Host = room creator (first participant)
The README does not define "host" explicitly beyond "the creator is automatically the host." We assume host identity is determined at room creation time and stored as the `id` of the first participant. Host status does not transfer if the creator leaves — that case is out of scope.

### 2. Polling reuses the existing GET /rooms/:code endpoint
No new endpoint is needed for lobby or game polling. The existing `GET /rooms/:code` endpoint returns a full room snapshot. The frontend will call this on an interval. The `participantId` query param is already supported for viewer-aware responses.

### 3. Deterministic word selection uses index mod list length
The README says the secret word is "deterministically selected from the starter list" but does not specify the rule. We assume: `word = STARTER_WORDS[roomCreationCount % STARTER_WORDS.length]` or equivalent index-based rule using a stable room property. `Math.random()` is forbidden by the constitution.

### 4. participantId is the stable identity token
The server returns a `participantId` UUID on create and join. This is the only identity token. The frontend stores it in the `RoomStore` state. It is used to determine host status by comparing against the room's `hostId` in the snapshot. There is no session, cookie, or auth.

### 5. Room status will need to expand beyond "lobby"
The current `RoomStatus` type is `"lobby"` only. Implementing Scenarios 2–4 will require adding `"playing"` and `"finished"` states. This is a planned extension to the model, not a rewrite.

---

## Relevant Files

### Backend

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Room, Participant, RoomSnapshot types — needs host field + status expansion |
| `backend/src/services/roomStore.ts` | In-memory store, createRoom, joinRoom, toRoomSnapshot — needs host assignment, start/guess/restart logic |
| `backend/src/api/rooms.ts` | Route handlers — needs start, guess, restart endpoints + improved join error messages |
| `backend/src/api/router.ts` | Route registration — needs new routes wired up |
| `backend/src/api/schemas.ts` | Zod schemas — needs validation for room code, player name, guess |
| `backend/src/seed/starterData.ts` | Word list and roles seed data — used for deterministic word selection |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | API client — has `/bug` URL bug; needs new method calls for start, guess, restart |
| `frontend/src/state/roomStore.ts` | Frontend store — needs polling logic, startGame, submitGuess, restartGame actions |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI — needs polling, host detection, guarded Start button |
| `frontend/src/pages/GamePage.tsx` | Game UI — needs interactive canvas, guess wiring, role awareness, polling, result state |
| `frontend/src/pages/CreateRoomPage.tsx` | Create room form — needs name trim/validation (Scenario 2) |
| `frontend/src/pages/JoinRoomPage.tsx` | Join room form — needs specific error messages for empty/invalid codes |
| `frontend/src/components/GuessForm.tsx` | Guess input — needs submission wired to API |
| `frontend/src/components/Scoreboard.tsx` | Score display — needs real score data |
| `frontend/src/components/ResultPanel.tsx` | Result display — needs correct word, scores, guess history |
