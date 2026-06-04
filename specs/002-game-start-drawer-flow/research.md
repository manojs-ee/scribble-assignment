# Research: Game Start & Drawer Flow

## Decision 1: Word selection determinism

**Decision**: Use a module-level `roomCreationCount` integer in `roomStore.ts`, incremented each time `createRoom()` is called. Word index = `roomCreationCount % STARTER_WORDS.length` at the moment the room is created (stored on the `Room` object as `wordIndex`). `startGame()` reads `room.wordIndex` to look up the word — no `Math.random()` anywhere in the path.

**Rationale**: Resets to 0 on server restart, giving the same sequence every time. Grader can reproduce by creating rooms in order. The index is captured at room creation (not at game start) so a late `POST /start` always gets the same word regardless of other rooms created in between.

**Alternatives considered**: Index computed at game-start time from current `rooms.size` — rejected because rooms could be created between room creation and game start, making the index non-deterministic relative to this room's position.

---

## Decision 2: `participantId` query param on GET /rooms/:code

**Decision**: `GET /rooms/:code?participantId=<id>` — the existing `roomViewerQuerySchema` already accepts `participantId` as an optional query param and `toRoomSnapshot` already receives `viewerParticipantId`. Only the body of `toRoomSnapshot` needs updating to use it.

**Rationale**: Infrastructure already in place from the starter. Zero new routes or schemas required.

**Alternatives considered**: Separate `GET /rooms/:code/word` endpoint — rejected (extra surface area, breaks constitution's "reuse existing endpoint" rule).

---

## Decision 3: `POST /rooms/:code/start` response shape

**Decision**: Returns the full `RoomSnapshot` (with `word` visible since the caller is the host/drawer) plus `participantId` mirroring the create/join response shape. Frontend stores the session and navigates to `/game`.

**Rationale**: Consistent response shape across all room-mutating endpoints. Frontend already knows how to handle `RoomSessionResponse`.

**Alternatives considered**: Return only `{ status: "playing" }` — rejected, requires an extra poll before GamePage can display word.

---

## Decision 4: Frontend name validation location

**Decision**: Inline validation in the form `onSubmit` handler — trim the value, check `.length === 0`, set a local `error` state string, render it below the input. No network call is made when validation fails.

**Rationale**: Matches existing pattern for room code validation in `JoinRoomPage`. No new libraries needed.

**Alternatives considered**: HTML5 `required` attribute — rejected, doesn't trim or give custom message. Schema validation on backend — already decided to be frontend-only for this scenario.

---

## Decision 5: `startGame` function placement

**Decision**: New exported function `startGame(code: string)` in `roomStore.ts` (backend service). Validates room exists and is in "lobby" status, sets `status = "playing"`, sets `drawerId = room.hostId`, sets `currentWord = STARTER_WORDS[room.wordIndex]`.

**Rationale**: All room mutations live in `roomStore.ts`. Keeps route handler thin.

**Alternatives considered**: Inline logic in route handler — rejected, inconsistent with existing pattern.
