# Tasks: Result State & Restart Flow

**Input**: Design documents from `specs/004-result-restart-flow/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: No test tasks — no test framework in starter; manual two-tab validation per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in every description

---

## Phase 1: Setup (No work needed)

No new project setup required. All infrastructure is in place from Scenarios 1–3.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend type extensions that both user stories depend on. Must complete before any story work.

**⚠️ CRITICAL**: All story phases depend on T001 completing first.

- [x] T001 Add `"finished"` to the `RoomStatus` union (`"lobby" | "playing" | "finished"`) and add `winnerId?: string` to both the `Room` interface and the `RoomSnapshot` interface in `backend/src/models/game.ts`

**Checkpoint**: Type foundation ready. Run `npm run build` in `backend/` to confirm zero errors before proceeding.

---

## Phase 3: User Story 1 — Game Ends and Results Screen Appears (Priority: P1) 🎯 MVP

**Goal**: First correct guess atomically sets room status to "finished" and records the winner. All players see results inline in GamePage within one polling cycle. Results show winner name, secret word (from winning guess), and final scoreboard.

**Independent Test**: Two tabs, start game. Tab 2 (guesser) submits the correct word. Both tabs switch to the results view within ~2s. Results show the guesser's name as winner, the word that was guessed, and the scoreboard with 100 pts for the winner. Tab 1 (drawer) also sees the results view, not the canvas.

### Implementation for User Story 1

- [x] T002 [US1] Extend `submitGuess()` in `backend/src/services/roomStore.ts`: add a guard `if (room.status === "finished") return { error: "already_finished" }` immediately before the existing `not_playing` guard; in the correct-guess path (after setting `room.scores[participantId] = 100`), also set `room.status = "finished"` and `room.winnerId = participantId` before calling `saveRoom()` — depends on T001

- [x] T003 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `winnerId: room.winnerId` in the returned snapshot object — depends on T001

- [x] T004 [US1] Add handling for the `already_finished` error in the `POST /:code/guess` route handler in `backend/src/api/rooms.ts`: map `already_finished` to `HttpError(409, "Game has already finished")` — depends on T002

- [x] T005 [P] [US1] Extend `RoomSnapshot` in `frontend/src/services/api.ts`: change `status` type to `"lobby" | "playing" | "finished"` and add `winnerId?: string` field — depends on T001 (backend type must be stable first, but this is a separate file)

- [x] T006 [US1] Update `frontend/src/pages/GamePage.tsx` to render the results view when `room.status === "finished"`: replace the entire game layout with a results panel that shows — winner name (`room.participants.find(p => p.id === room.winnerId)?.name ?? "Unknown"`), the secret word (taken from the last `isCorrect === true` guess in `room.guesses`, i.e. `room.guesses.findLast(g => g.isCorrect)?.text ?? ""`), and the `<Scoreboard>` component with final scores; also add a `useEffect` that navigates to `/lobby` when `room.status === "lobby"` (for post-restart detection); host sees a placeholder "Play Again" button (wired in US2), non-host sees "Waiting for the host to start a new game..." — depends on T005

**Checkpoint**: US1 fully functional. Two-tab correct-guess → results transition must pass before Phase 4.

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P2)

**Goal**: Host clicks "Play Again" on results screen → `POST /rooms/:code/restart` → room resets to lobby → all players navigate back to lobby via polling.

**Independent Test**: After results screen appears, Tab 1 (host) clicks "Play Again". Both tabs navigate to lobby within ~2s. Participant list unchanged. Start Game button appears and a new game can begin.

### Implementation for User Story 2

- [x] T007 [US2] Add `restartGame(code: string): { error: "not_found" } | { ok: true }` exported function to `backend/src/services/roomStore.ts`: get room (return `not_found` if absent); if `room.status === "lobby"` return `{ ok: true }` (idempotent); otherwise reset: `room.status = "lobby"`, `room.strokes = []`, `room.guesses = []`, `room.scores = {}`, `room.currentWord = undefined`, `room.drawerId = undefined`, `room.winnerId = undefined`; call `saveRoom(room)`; return `{ ok: true }` — depends on T001

- [x] T008 [US2] Add `router.post("/:code/restart", ...)` route handler to `backend/src/api/rooms.ts`: import `restartGame` from roomStore, parse params with `roomCodeParamsSchema`, call `restartGame(code.toUpperCase())`, respond 404 on `not_found`, 200 with `{ ok: true }` on success — depends on T007

- [x] T009 [P] [US2] Add `restartGame(code: string)` API function to `frontend/src/services/api.ts` calling `POST /rooms/${encodeURIComponent(code)}/restart` with empty body, returning `{ ok: boolean }` — depends on T005

- [x] T010 [US2] Add `restartGame()` action method to the `RoomStore` class in `frontend/src/state/roomStore.ts` that calls `api.restartGame(this.state.room!.code)` — depends on T009

- [x] T011 [US2] Wire the "Play Again" button in `frontend/src/pages/GamePage.tsx`: replace the placeholder "Play Again" button with an async handler that calls `roomStore.restartGame()` on click (no explicit navigation needed — the existing `useEffect` from T006 that watches `room.status === "lobby"` will navigate to `/lobby` automatically when polling detects the reset) — depends on T010

**Checkpoint**: US2 fully functional. Play Again → lobby navigation must work on both tabs within ~2s.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T012 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors — fix any type errors from `RoomStatus` extension and `winnerId` field additions
- [x] T013 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors — fix any type errors from updated `RoomStatus` and `winnerId` in `RoomSnapshot`
- [x] T014 Full two-tab integration validation: start game → submit correct word → both tabs show results (winner name, word, scoreboard) → host clicks Play Again → both tabs return to lobby → start another game to confirm the full loop works — depends on T012, T013

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on T001
- **US2 (Phase 4)**: Depends on T001 (backend types) and T005 (frontend types); T006 must exist before T011
- **Polish (Phase 5)**: Depends on all story phases

### Task Dependencies

- T001 → T002, T003, T004, T005 (all downstream tasks need the type foundation)
- T002 → T004 (route handler needs updated submitGuess error codes)
- T002 → T003 (toRoomSnapshot needs winnerId from Room)
- T005 → T006 (GamePage needs updated RoomSnapshot type)
- T005 → T009 (API function needs updated RoomSnapshot type)
- T007 → T008 (route needs restartGame function)
- T009 → T010 → T011 (API → store → page wiring)
- T006 must exist before T011 (T011 wires the button placeholder added in T006)

### Parallel Opportunities

Within Phase 3:
- T002+T003 (backend roomStore) ∥ T005 (frontend types) — different codebases

Within Phase 4:
- T007+T008 (backend restart) ∥ T009 (frontend API) — different codebases

Within Phase 5:
- T012 ∥ T013 — different build processes

---

## Parallel Example: User Story 1

```
# After T001, these two chains run simultaneously:

Backend chain:
T002 (extend submitGuess) → T003 (toRoomSnapshot) → T004 (route 409)

Frontend chain:
T005 (extend RoomSnapshot type) → T006 (GamePage results view)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (foundational types)
2. T002 → T003 → T004 (backend: finished transition + snapshot + route guard)
3. T005 → T006 (frontend: types + GamePage results view)
4. **STOP and VALIDATE**: Two-tab correct-guess → results test
5. Run builds (T012, T013)

### Incremental Delivery

1. T001 → US1 (results screen) → two-tab validate
2. US2 (Play Again + restart) → lobby-navigation validate
3. T012–T014 (full build + integration loop test)

---

## Notes

- [P] tasks = different files, no shared state, safe to run simultaneously
- The `useEffect` in GamePage watching `room.status === "lobby"` handles navigation for BOTH the post-restart case AND any future lobby-return scenario — it must fire on any poll that returns lobby status, not just after restart
- `restartGame()` is idempotent: calling it on an already-lobby room returns `{ ok: true }` without error — safe to call multiple times
- The secret word on the results screen comes from `room.guesses.findLast(g => g.isCorrect)?.text` — this works for all players including the drawer since guesses are always in the snapshot
- Do NOT reset `room.wordIndex` in `restartGame()` — it was set at room creation and stays fixed across games
- LobbyPage's existing `useEffect` that navigates to `/game` when `status === "playing"` is safe: after restart, room returns to "lobby" not "playing", so it won't fire until the host explicitly starts a new game
