# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/rooms.md ✅

**Tests**: Not requested — manual validation in two browser tabs per spec acceptance criteria.

**Spec → FR traceability**: Every task maps to at least one FR from spec.md.

---

## Phase 1: Setup

**Purpose**: Unblock all frontend API work before anything else.

- [ ] T001 Fix API base URL bug — remove `/bug` suffix in `frontend/src/services/api.ts:22`, change to `http://localhost:3001` [FR-003, Constitution §I]

**Checkpoint**: `GET /health` returns `{ ok: true }` from the frontend. All subsequent API calls reach the backend.

---

## Phase 2: Foundational — Host Identity Model

**Purpose**: Add `hostId` to the backend and frontend type system. All user stories depend on this.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `hostId: string` field to both `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts` [FR-001, FR-002]
- [ ] T003 Set `room.hostId = participant.id` in `createRoom()` in `backend/src/services/roomStore.ts` [FR-001]
- [ ] T004 Expose `hostId` in `toRoomSnapshot()` return value in `backend/src/services/roomStore.ts` [FR-002]
- [ ] T005 Add `hostId: string` field to frontend `RoomSnapshot` interface in `frontend/src/services/api.ts` [FR-002]

**Checkpoint**: Create a room via `POST /rooms` and confirm the response includes `room.hostId` equal to `participantId`. Verify in browser Network tab or with `curl`.

---

## Phase 3: User Story 1 — Room Creation & Host Assignment (P1)

**Goal**: Creator lands in lobby as identified host. Rooms are isolated.

**Independent Test**: Create a room in one tab. Confirm lobby shows a host indicator next to the creator's name.

- [ ] T006 [US1] Add host visual indicator (e.g. "(Host)" label) next to the host participant in the player list in `frontend/src/pages/LobbyPage.tsx` — derive `isHost` as `room.hostId === participantId` [FR-001, FR-002, Spec §US1-AC2]

**Checkpoint**: One tab — create room, land in lobby, confirm host indicator visible on the creator's entry. US1 independently verified.

---

## Phase 4: User Story 2 — Join Room by Code (P2)

**Goal**: Valid join works. Empty and invalid codes show specific error messages.

**Independent Test**: Tab 2 joins Tab 1's room with a valid code — both appear in each other's lobby. Tab 2 submits empty code → "Room code is required". Tab 2 submits wrong code → "Room not found — check your code and try again".

- [ ] T007 [US2] Add Zod `.trim().min(1)` refinement to `code` in `roomCodeParamsSchema` in `backend/src/api/schemas.ts` — return 400 with `{ message: "Room code is required" }` for empty/whitespace codes [FR-006]
- [ ] T008 [US2] Update 404 message in `joinRoom` handler in `backend/src/api/rooms.ts` from `"Unable to join room"` to `"Room not found — check your code and try again"` [FR-007]

**Checkpoint**: Two browser tabs — valid join works; empty code shows "Room code is required"; non-existent code shows "Room not found — check your code and try again". US2 independently verified.

---

## Phase 5: User Story 3 — Automatic Lobby Polling (P3)

**Goal**: Lobby refreshes every ~2s automatically. New joiners appear without manual action. Polling stops on navigate away.

**Independent Test**: Tab 1 in lobby. Tab 2 joins. Tab 1's participant list updates within 2 seconds with no button press. Navigate Tab 1 away — Network tab shows polling stops.

- [ ] T009 [US3] Replace manual `handleRefresh` + "Refresh Room" button with `useEffect` + `setInterval(2000)` calling `roomStore.fetchRoom()` in `frontend/src/pages/LobbyPage.tsx` — remove `refreshError` state and `handleRefresh` function entirely, return cleanup function that calls `clearInterval` [FR-003, FR-009, FR-010]

**Checkpoint**: Two tabs — joiner appears in host's lobby within 2 seconds. Navigate away — polling stops. Single poll failure does not break the loop (can simulate with backend restart). Also open a second room in a third tab and confirm participant lists are fully isolated (FR-008, SC-005). US3 independently verified.

---

## Phase 6: User Story 4 — Host-Only Start Game (P4)

**Goal**: Start Game button visible only to host, disabled until ≥2 players, navigates to `/game` on click.

**Independent Test**: Host tab (1 player) — button visible, disabled. Second tab joins. Within 2 seconds — button enables for host. Second tab — no button visible.

- [ ] T010 [US4] Gate Start Game button to host-only with 2-player minimum in `frontend/src/pages/LobbyPage.tsx`:
  - derive `isHost = room.hostId === participantId`
  - derive `canStart = isHost && room.participants.length >= 2`
  - render button only when `isHost`, disabled when `!canStart`
  - on click: `navigate("/game")` (placeholder — Scenario 2 replaces) [FR-004, FR-005, Spec §US4-AC1–AC4]

**Checkpoint**: Full Scenario 1 acceptance criteria verified in two browser tabs. US4 independently verified.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Clean up starter noise introduced by the above changes.

- [ ] T011 Add frontend validation in `frontend/src/pages/JoinRoomPage.tsx` — trim room code before submit; if empty after trim show "Room code is required" inline without making an API call [FR-006]
- [ ] T012 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors
- [ ] T013 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors

**Checkpoint**: Both builds pass clean. Ready for Scenario 2 spec iteration.

---

## Dependencies & Execution Order

```
T001 (fix URL bug)
  └─→ T002–T005 (host identity model — backend + frontend types)
        └─→ T006 (US1: host indicator in lobby)
        └─→ T007–T008 (US2: join validation — backend + frontend)
        └─→ T009 (US3: polling)
              └─→ T010 (US4: host-only start button — needs polling to keep count live)
                    └─→ T011–T013 (frontend validation + build checks)
```

**US2 and US3 can proceed in parallel after Phase 2** — they touch different files (schemas/rooms.ts vs LobbyPage.tsx).

---

## Implementation Strategy

### MVP First (US1 only)
1. T001 → T002–T005 → T006
2. Validate: one tab, host indicator visible
3. Stop and confirm before proceeding

### Incremental Delivery
1. T001 → T002–T005 → Foundation ready
2. T006 → US1 ✅
3. T007–T008, T011 → US2 ✅
4. T009 → US3 ✅
5. T010 → US4 ✅ → Full Scenario 1 done
6. T012–T013 → Clean builds

---

## Notes

- `[P]` = parallelisable (different files, no incomplete dependencies)
- `[USN]` = maps to user story N in spec.md
- Each checkpoint must pass before the next phase begins (constitution §V)
- All AI-generated code must be reviewed line-by-line before committing (constitution §VI)
- No new npm packages — all changes use what the starter already ships (constitution §Technical Constraints)
