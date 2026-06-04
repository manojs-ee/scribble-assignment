# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: No test tasks — no test framework in starter; manual two-tab validation per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (No work needed)

No new project setup is required. The backend and frontend dev servers, TypeScript compilers, and build tools are all in place from Scenario 1.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend type extensions that every user story depends on. Must complete before any story work.

**⚠️ CRITICAL**: All three user story phases depend on T001 completing first.

- [ ] T001 Extend `RoomStatus` union to `"lobby" | "playing"` and add `drawerId?: string`, `currentWord?: string`, `wordIndex: number` fields to `Room` interface, and add `drawerId?: string`, `word?: string` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`

**Checkpoint**: Type foundation ready — compiler will now enforce the new fields across the codebase. User story work can begin.

---

## Phase 3: User Story 1 — Host Starts the Game (Priority: P1) 🎯 MVP

**Goal**: Host clicks Start Game → room transitions to "playing", drawer assigned, word selected deterministically; drawer sees word, guessers do not.

**Independent Test**: Open two browser tabs, create room in Tab 1, join in Tab 2. Click Start Game in Tab 1. Tab 1 shows "You are the drawer" + the secret word. Tab 2 shows "You are guessing" with no word. Inspect Tab 2's network response and confirm `word` is absent from the JSON.

### Implementation for User Story 1

- [ ] T002 [US1] Add module-level `let roomCreationCount = 0` counter, increment it in `createRoom()` and set `room.wordIndex = roomCreationCount % STARTER_WORDS.length` on the new room, and update `toRoomSnapshot()` to include `drawerId: room.drawerId` and conditionally include `word: room.currentWord` only when `viewerParticipantId === room.drawerId` — use `word: undefined` or omit the key entirely when the viewer is not the drawer; never set `word: null` (optional fields must be absent from JSON, not null) — in `backend/src/services/roomStore.ts`

- [ ] T003 [US1] Add exported `startGame(code: string)` function to `backend/src/services/roomStore.ts` that: gets the room (returns `{ error: "not_found" }` if absent), returns `{ error: "already_playing" }` if `room.status === "playing"`, otherwise sets `room.status = "playing"`, `room.drawerId = room.hostId`, `room.currentWord = STARTER_WORDS[room.wordIndex]`, calls `saveRoom(room)`, and returns the cloned room — depends on T002

- [ ] T004 [US1] Register `router.post("/:code/start", ...)` route handler in `backend/src/api/rooms.ts` that parses params with `roomCodeParamsSchema`, calls `startGame(code.toUpperCase())`, responds 404 on `not_found`, 409 on `already_playing`, and 200 with `{ participantId: room.drawerId, room: toRoomSnapshot(room, room.drawerId) }` on success — depends on T003

- [ ] T005 [P] [US1] Extend frontend `RoomSnapshot` type: change `status` to `"lobby" | "playing"`, add `drawerId?: string`, `word?: string` fields, and add `startRoom(code: string)` API function calling `POST /rooms/:code/start` returning `RoomSessionResponse` in `frontend/src/services/api.ts`

- [ ] T006 [US1] Add `startRoom()` action method to the `RoomStore` class in `frontend/src/state/roomStore.ts` that calls `api.startRoom(this.state.room!.code)` inside `withLoading()` and calls `setRoomSession(response)` on success — depends on T005

- [ ] T007 [US1] Replace the LobbyPage Start Game button `onClick` handler: change from `() => navigate("/game")` to an async handler that calls `roomStore.startRoom()` and navigates to `/game` on success, and sets a local `error` state string on failure (including 409 "already playing" — the generic error handler covers this case), rendering the error below the button in `frontend/src/pages/LobbyPage.tsx`; the existing `setInterval` polling `useEffect` requires no change — React's unmount cleanup stops it naturally on navigation — depends on T006

- [ ] T008 [US1] Implement GamePage polling and role UI in `frontend/src/pages/GamePage.tsx`: add a `useEffect` with `setInterval` (~2000ms) calling `roomStore.fetchRoom()` with cleanup on unmount (mirror LobbyPage's pattern exactly); compute `isDrawer = room.drawerId === participantId`; replace the canvas placeholder section with a role banner — "You are the drawer" + `room.word` when `isDrawer`, "You are guessing" otherwise — depends on T005

**Checkpoint**: User Story 1 fully functional. Two-tab validation must pass before moving to Phase 4.

---

## Phase 4: User Story 2 — Player Name Validation on Create & Join (Priority: P2)

**Goal**: Empty or whitespace-only player names are rejected with an inline error before any API call is made on both the Create Room and Join Room forms.

**Independent Test**: On the Create Room page, type spaces only in the name field and click submit — an error message appears, no network request fires (observe in DevTools Network tab). Repeat on the Join Room page. Enter a valid name on both — submission proceeds normally.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Add local `nameError` state and name validation to `frontend/src/pages/CreateRoomPage.tsx` (or the page/component responsible for the create-room form): in the submit handler, use `String.prototype.trim()` (leading/trailing whitespace only — do not normalise internal spaces), if the trimmed value is empty set `nameError` to "Name is required" and return early with no API call; clear `nameError` on input change; render the error message below the name input

- [ ] T010 [P] [US2] Add local `nameError` state and name validation to `frontend/src/pages/JoinRoomPage.tsx`: in the submit handler, use `String.prototype.trim()` (leading/trailing whitespace only), if the trimmed value is empty set `nameError` to "Name is required" and return early with no API call; clear `nameError` on input change; render the error message below the name input (room code validation already exists from Scenario 1 — do not remove it)

**Checkpoint**: User Story 2 fully functional and independent of US1. Name validation works on both forms.

---

## Phase 5: User Story 3 — Deterministic Word Selection (Priority: P3)

**Goal**: Confirm the word selection rule is deterministic and reproducible. This story is validated by the implementation already delivered in T002–T003; Phase 5 is a verification and documentation phase only.

**Independent Test**: Restart the backend server. Create two rooms sequentially and start each. Record the words. Restart the server again. Repeat the same sequence. Both runs produce the same words in the same order.

### Implementation for User Story 3

- [ ] T011 [US3] Manually verify deterministic word selection: restart the backend, create two rooms, start each, record the words, restart again, repeat — confirm `room 1 → STARTER_WORDS[1]` ("pizza") and `room 2 → STARTER_WORDS[2]` ("castle") every time. No code change needed if T002–T003 are correct; if behaviour differs, fix the `wordIndex` capture logic in `backend/src/services/roomStore.ts`

**Checkpoint**: Determinism confirmed. Ready for Polish phase.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and two-tab integration test per constitution.

- [ ] T012 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors — fix any type errors introduced by the `Room`/`RoomSnapshot` extensions in T001
- [ ] T013 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors — fix any type errors from the updated `RoomSnapshot` type in T005
- [ ] T014 Full two-tab integration validation: create room Tab 1, join Tab 2, start game Tab 1, verify drawer UI Tab 1, verify guesser UI Tab 2, inspect network responses for `word` field presence/absence, test name validation on both forms — depends on T012, T013

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on T001 (foundational type extension)
- **US2 (Phase 4)**: Independent of US1 — can begin after T001 (only needs frontend form access)
- **US3 (Phase 5)**: Depends on T002, T003 (word selection logic) — validate after US1 complete
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **T001** → blocks T002, T003, T004 (backend type changes must compile first)
- **T002** → T003 (startGame uses roomCreationCount and wordIndex set in T002)
- **T003** → T004 (route handler calls startGame)
- **T005** → T006 → T007 (frontend type → store action → page wiring)
- **T005** → T008 (GamePage needs updated RoomSnapshot type)
- **T009, T010**: fully parallel, no dependencies on any other task except T001 being done

### Parallel Opportunities

Within Phase 3:
- T005 (frontend types) can start in parallel with T002 (backend service) — different codebases
- T008 (GamePage) and T007 (LobbyPage) cannot start until T005 and T006 complete respectively

Within Phase 4:
- T009 and T010 are fully parallel (different files)

Within Phase 6:
- T012 and T013 are fully parallel (different build processes)

---

## Parallel Example: User Story 1

```
# These two can start simultaneously after T001:
T002: backend/src/services/roomStore.ts  (backend)
T005: frontend/src/services/api.ts       (frontend)

# Once T002 done:
T003: backend/src/services/roomStore.ts  (startGame function)

# Once T003 done:
T004: backend/src/api/rooms.ts           (route handler)

# Once T005 done:
T006: frontend/src/state/roomStore.ts    (store action)

# Once T006 done — these are parallel:
T007: frontend/src/pages/LobbyPage.tsx   (button wiring)
T008: frontend/src/pages/GamePage.tsx    (polling + role UI)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (foundational types)
2. Complete T002 → T003 → T004 (backend service + route)
3. Complete T005 → T006 → T007 → T008 (frontend types + store + pages)
4. **STOP and VALIDATE**: Two-tab test per Independent Test criteria above
5. Run builds (T012, T013)

### Incremental Delivery

1. T001 (foundation) → US1 (game start + drawer UI) → two-tab validate
2. US2 (name validation) → spot-check both forms
3. US3 (determinism confirm) → restart test
4. T012–T014 (builds + full integration)

---

## Notes

- [P] tasks = different files, no shared state, safe to run simultaneously
- [Story] label maps each task to a user story for spec traceability
- `STARTER_WORDS` is a `const` tuple — TypeScript will enforce index type; cast with `as string` if needed
- Do not remove or modify the existing `availableWords` and `roles` fields in `RoomSnapshot` — backwards compat
- The existing `roomViewerQuerySchema` in `schemas.ts` already accepts `participantId` — no schema change needed
- LobbyPage's existing polling `useEffect` does not need modification — it stops naturally on navigation/unmount
