# Tasks: Drawing Canvas, Guessing & Scoring

**Input**: Design documents from `specs/003-canvas-guessing-scoring/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: No test tasks — no test framework in starter; manual two-tab validation per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (No work needed)

No new project setup required. Backend and frontend dev servers, TypeScript compilers, and build tools are all in place from Scenarios 1 & 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend type extensions that all three user stories depend on. Must complete before any story work.

**⚠️ CRITICAL**: All user story phases depend on T001 and T002 completing first.

- [x] T001 Add `Point` interface `{ x: number; y: number }` and `Guess` interface `{ id: string; participantId: string; participantName: string; text: string; isCorrect: boolean; timestamp: string }` to `backend/src/models/game.ts`

- [x] T002 Extend `Room` interface with `strokes: Point[][]`, `guesses: Guess[]`, `scores: Record<string, number>` fields, and extend `RoomSnapshot` interface with `strokes: Point[][]`, `guesses: Guess[]`, `scores: Record<string, number>` fields in `backend/src/models/game.ts` — depends on T001

**Checkpoint**: Type foundation ready — all story phases can begin. Run `npm run build` in `backend/` to confirm zero errors.

---

## Phase 3: User Story 1 — Drawer Draws on the Canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer draws freehand on a 600×400 canvas; strokes sent to backend on pointer-up via `POST /rooms/:code/stroke`; guesser canvas replays all strokes from polling response; Clear Canvas button wipes both local and backend state.

**Independent Test**: Two tabs, start game. Tab 1 (drawer): draw strokes — they appear locally. Tab 2 (guesser): canvas updates within ~2s. Tab 1: click Clear Canvas — both tabs show blank canvas within ~2s. Inspect `GET /rooms/:code` response and confirm `strokes` array is present.

### Implementation for User Story 1

- [x] T003 [US1] In `startGame()` in `backend/src/services/roomStore.ts`, initialise `room.strokes = []`, `room.guesses = []`, and `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))` before calling `saveRoom()` — depends on T002

- [x] T004 [US1] Add `addStroke(code: string, points: Point[])` exported function to `backend/src/services/roomStore.ts`: get room (return `{ error: "not_found" }` if absent), return `{ error: "not_playing" }` if `room.status !== "playing"`, push `points` to `room.strokes`, call `saveRoom()`, return `{ ok: true }` — depends on T003

- [x] T005 [US1] Add `clearCanvas(code: string)` exported function to `backend/src/services/roomStore.ts`: get room, guard playing status (same pattern as T004), set `room.strokes = []`, call `saveRoom()`, return `{ ok: true }` — depends on T003

- [x] T006 [US1] Add `strokeSchema = z.object({ points: z.array(z.object({ x: z.number(), y: z.number() })).min(1) })` to `backend/src/api/schemas.ts`

- [x] T007 [US1] Add `router.post("/:code/stroke", ...)` and `router.post("/:code/clear-canvas", ...)` route handlers to `backend/src/api/rooms.ts`: import `addStroke` and `clearCanvas` from roomStore; parse params with `roomCodeParamsSchema`; stroke route also parses body with `strokeSchema`; respond 404 on `not_found`, 409 on `not_playing`, 200 with `{ ok: true }` on success — depends on T004, T005, T006

- [x] T008 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `strokes: room.strokes ?? []`, `guesses: room.guesses ?? []`, `scores: room.scores ?? {}` in the returned snapshot — depends on T002

- [x] T009 [P] [US1] Add `Point` interface and `GuessSnapshot` interface (`{ id, participantId, participantName, text, isCorrect, timestamp }`) to `frontend/src/services/api.ts`, extend `RoomSnapshot` with `strokes: Point[][]`, `guesses: GuessSnapshot[]`, `scores: Record<string, number>`, and add `addStroke(code: string, points: Point[])` and `clearCanvas(code: string)` API functions calling `POST /rooms/:code/stroke` and `POST /rooms/:code/clear-canvas` respectively

- [x] T010 [US1] Add `addStroke(points: Point[])` and `clearCanvas()` action methods to the `RoomStore` class in `frontend/src/state/roomStore.ts` that call `api.addStroke(room.code, points)` and `api.clearCanvas(room.code)` respectively — depends on T009

- [x] T011 [US1] Create `frontend/src/components/DrawingCanvas.tsx`: props are `strokes: Point[][]`, `isDrawer: boolean`, `onStroke: (points: Point[]) => void`, `onClear: () => void`; render a `<canvas>` element with `width={600}` `height={400}` and a `useRef`; add a `useEffect` on the `strokes` prop that calls `clearRect(0,0,600,400)` then replays all strokes as polylines (`beginPath`, `moveTo` first point, `lineTo` each subsequent point, `stroke()`); when `isDrawer` attach `onMouseDown`/`onMouseMove`/`onMouseUp`/`onMouseLeave` handlers to collect `{x,y}` points from `canvas.getBoundingClientRect()` offset, draw incremental segments locally, and call `onStroke(currentPoints)` on mouseup/mouseleave when drawing; render "Clear Canvas" button only when `isDrawer` — depends on T009

- [x] T012 [US1] Replace the canvas placeholder `<div>` in `frontend/src/pages/GamePage.tsx` with `<DrawingCanvas strokes={room.strokes ?? []} isDrawer={isDrawer} onStroke={async (points) => { try { await roomStore.addStroke(points); } catch {} }} onClear={async () => { try { await roomStore.clearCanvas(); } catch {} }} />`; keep the existing role banner ("You are the drawer" / "You are guessing") above the canvas — depends on T010, T011

**Checkpoint**: US1 fully functional. Two-tab draw + clear validation must pass before Phase 4.

---

## Phase 4: User Story 2 — Guesser Submits a Guess (Priority: P2)

**Goal**: Guesser submits a word; backend evaluates case-insensitive match against `currentWord`; correct guess = 100 pts (capped), incorrect = 0; guess recorded in history; drawer cannot see or use the guess input.

**Independent Test**: Two tabs, start game. Tab 2 (guesser): submit the correct word → guess history entry marked correct, score becomes 100. Submit a wrong word → marked incorrect, score stays. Submit empty/spaces → inline error, no network request. Tab 1 (drawer): no guess input visible.

### Implementation for User Story 2

- [x] T013 [US2] Add `guessSchema = z.object({ participantId: z.string().min(1), text: z.string().min(1) })` to `backend/src/api/schemas.ts`

- [x] T014 [US2] Add `submitGuess(code: string, participantId: string, text: string)` exported function to `backend/src/services/roomStore.ts`: get room (return `{ error: "not_found" }` if absent), return `{ error: "not_playing" }` if not playing, find participant by id (return `{ error: "not_found" }` if absent), evaluate `isCorrect = text.trim().toLowerCase() === (room.currentWord ?? "").toLowerCase()`, build `Guess` object with `randomUUID()` id, if `isCorrect && (room.scores[participantId] ?? 0) < 100` set `room.scores[participantId] = 100`, push guess to `room.guesses`, call `saveRoom()`, return `{ guess, score: room.scores[participantId] }` — depends on T003

- [x] T015 [US2] Add `router.post("/:code/guess", ...)` route handler to `backend/src/api/rooms.ts`: import `submitGuess` from roomStore, parse params with `roomCodeParamsSchema` and body with `guessSchema`, respond 404/409 on errors, 200 with `{ guess, score }` on success — depends on T013, T014

- [x] T016 [P] [US2] Add `submitGuess(code: string, participantId: string, text: string)` API function to `frontend/src/services/api.ts` calling `POST /rooms/:code/guess` with body `{ participantId, text }` returning `{ guess: GuessSnapshot; score: number }` — depends on T009

- [x] T017 [US2] Add `submitGuess(text: string)` action method to `RoomStore` in `frontend/src/state/roomStore.ts` that calls `api.submitGuess(room.code, participantId!, text)` — depends on T016

- [x] T018 [US2] Update `frontend/src/components/GuessForm.tsx` to accept props `onSubmit: (text: string) => Promise<void>` and `disabled: boolean`; in `handleSubmit`: trim the input value, if empty set local `guessError` state to "Guess cannot be empty" and return early; else call `onSubmit(trimmedText)` and clear the input on success; render `guessError` as an inline error below the input; clear error on input change — depends on T016

- [x] T019 [US2] In `frontend/src/pages/GamePage.tsx`: pass `onSubmit={async (text) => { await roomStore.submitGuess(text); }}` and `disabled={false}` to `<GuessForm>` when `!isDrawer`; hide `<GuessForm>` entirely when `isDrawer` (render `null` or omit) — depends on T017, T018

**Checkpoint**: US2 fully functional and independent of US1 canvas. Guess submission, scoring, and drawer exclusion all verified.

---

## Phase 5: User Story 3 — Guess History & Scoreboard Visible to All (Priority: P3)

**Goal**: All players see the full guess history (`ResultPanel`) and scoreboard (`Scoreboard`) updated via polling. No new backend work — data already in `GET /rooms/:code` response from US1/US2.

**Independent Test**: Both tabs see the same guess history and scoreboard, updating within ~2s of any guess submission from either tab.

### Implementation for User Story 3

- [x] T020 [P] [US3] Update `frontend/src/components/Scoreboard.tsx` to accept props `participants: Participant[]` and `scores: Record<string, number>`; render a row per participant sorted by score descending showing participant name and score; import `Participant` type from `../services/api`

- [x] T021 [P] [US3] Update `frontend/src/components/ResultPanel.tsx` to accept prop `guesses: GuessSnapshot[]`; render guess history in chronological order (earliest first) showing participant name, guess text, and a correct/incorrect indicator (e.g., "✓" or "✗"); import `GuessSnapshot` type from `../services/api`

- [x] T022 [US3] In `frontend/src/pages/GamePage.tsx`, pass `participants={room.participants}` and `scores={room.scores ?? {}}` to `<Scoreboard>`, and pass `guesses={room.guesses ?? []}` to `<ResultPanel>` — depends on T020, T021

**Checkpoint**: All three user stories working together. Scoreboard and history update on both tabs within ~2s.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T023 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors — fix any type errors from `Point`, `Guess`, `Room`/`RoomSnapshot` extensions
- [x] T024 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors — fix any type errors from `Point`, `GuessSnapshot`, `RoomSnapshot` extensions and new component props
- [x] T025 Full two-tab integration validation: draw strokes (Tab 1 drawer, Tab 2 guesser sees update), clear canvas (both tabs blank), submit correct guess (marked correct, score 100 on both tabs), submit wrong guess (marked incorrect), submit empty guess (error shown, no request), confirm drawer has no guess input — depends on T023, T024

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on T001, T002
- **US2 (Phase 4)**: Depends on T003 (scores init in startGame); T013–T015 can start after T001/T002; T016–T019 can start after T009
- **US3 (Phase 5)**: Depends on T009 (frontend types); T020/T021 can start after T009; T022 depends on T020/T021
- **Polish (Phase 6)**: Depends on all story phases

### Task Dependencies

- T001 → T002 (RoomSnapshot extends Room types)
- T002 → T003, T008 (backend model must compile)
- T003 → T004, T005, T014 (startGame init needed before game-state mutations)
- T004 → T007 (addStroke needed before route)
- T005 → T007 (clearCanvas needed before route)
- T006 → T007 (schema needed before route)
- T009 → T010, T011, T016, T020, T021 (frontend types needed by all)
- T010 → T012 (store actions needed before GamePage wiring)
- T011 → T012 (DrawingCanvas component needed before GamePage)
- T016 → T017 → T018/T019 (API → store → component/page)
- T020, T021 → T022 (components needed before GamePage wiring)

### Parallel Opportunities

Within Phase 3:
- T003–T008 (backend) ∥ T009–T011 (frontend) — different codebases, start simultaneously after T001/T002

Within Phase 4:
- T013–T015 (backend guess) ∥ T016–T018 (frontend guess) — can run in parallel after T003/T009

Within Phase 5:
- T020 ∥ T021 — different component files

Within Phase 6:
- T023 ∥ T024 — different build processes

---

## Parallel Example: User Story 1

```
# After T001+T002, these two chains run simultaneously:

Backend chain:
T003 → T004 → T007 (addStroke route)
T003 → T005 → T007 (clearCanvas route)
T006 → T007
T008 (toRoomSnapshot update, independent of T004/T005)

Frontend chain:
T009 → T010 → T012
T009 → T011 → T012
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 → T002 (foundational types)
2. T003 → T004/T005/T006/T007/T008 (backend service + routes + snapshot)
3. T009 → T010/T011 → T012 (frontend types + DrawingCanvas + GamePage)
4. **STOP and VALIDATE**: Two-tab draw + clear test
5. Run builds (T023, T024)

### Incremental Delivery

1. T001/T002 → US1 (canvas) → two-tab draw/clear validate
2. US2 (guessing + scoring) → correct/incorrect/empty guess validate
3. US3 (scoreboard + history wiring) → both-tab update validate
4. T023–T025 (full build + integration)

---

## Notes

- [P] tasks = different files, no shared state, safe to run simultaneously
- `structuredClone` in `saveRoom()` handles `Record<string, number>` correctly — no special serialisation needed
- `GuessForm` is hidden entirely (not just disabled) for the drawer in `GamePage` — render `null` when `isDrawer`
- Score cap: `if (isCorrect && (room.scores[participantId] ?? 0) < 100)` — never set above 100
- `POST /stroke` and `POST /clear-canvas` both guard `room.status === "playing"` — return 409 otherwise
- Canvas touch support: add `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers in `DrawingCanvas` using `event.touches[0].clientX/Y` offset from `getBoundingClientRect()` — same logic as mouse handlers
- Do not remove existing `availableWords` and `roles` fields from `RoomSnapshot` — backwards compat
