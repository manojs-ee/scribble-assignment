# Research: Result State & Restart Flow

## Decision 1: "finished" state detection — polling only

**Decision**: Clients detect `room.status === "finished"` via the existing `GET /rooms/:code` poll. No new endpoint or push mechanism is needed. GamePage already polls every 2s; it simply checks the status on each poll result and switches rendering mode.

**Rationale**: Constitution mandates polling only. The existing polling infrastructure in GamePage (`setInterval`/`useEffect`) is already in place from Scenario 2/3. Zero new infrastructure needed.

**Alternatives considered**: Separate `GET /rooms/:code/result` endpoint — rejected (unnecessary complexity, constitution violation risk).

---

## Decision 2: "finished" transition triggered inside `submitGuess()`

**Decision**: The `submitGuess()` function in `roomStore.ts` is the single place where "finished" is set. When `isCorrect === true` and the room is currently "playing", the function also sets `room.status = "finished"` and `room.winnerId = participantId`. No separate endpoint needed.

**Rationale**: Atomic — guess recording and status transition happen in one `saveRoom()` call. No race condition window between "correct guess recorded" and "status changed".

**Alternatives considered**: Separate `POST /rooms/:code/finish` — rejected (requires two sequential calls, creates a window for race conditions).

---

## Decision 3: `POST /rooms/:code/restart` resets to fresh lobby state

**Decision**: Restart sets `room.status = "lobby"`, clears `room.strokes = []`, `room.guesses = []`, `room.scores = {}`, `room.currentWord = undefined`, `room.drawerId = undefined`, `room.winnerId = undefined`. `room.wordIndex` is NOT reset — the next `startGame()` call will use the current `wordIndex` which was set at room creation and stays fixed. Participants list is unchanged.

**Rationale**: `wordIndex` is set at room creation time (Scenario 2 decision), not at game start, so it doesn't need resetting. All game-state fields need clearing so the next `startGame()` starts fresh.

**Alternatives considered**: Delete and recreate the room — rejected (participants would lose their IDs, breaking frontend state).

---

## Decision 4: FR-009 — `submitGuess()` returns 409 when room is "finished"

**Decision**: Extend the existing `submitGuess()` guard chain: after the `not_playing` guard, add `if (room.status === "finished") return { error: "already_finished" }`. Route handler maps this to 409.

**Rationale**: Prevents any late-arriving guess from being processed after game end. Clean, consistent with existing guard pattern.

---

## Decision 5: Results view rendered inline in GamePage

**Decision**: GamePage checks `room.status`. If "playing" → existing game UI. If "finished" → results panel (winner name, secret word, scoreboard, Play Again or waiting message). No new component file strictly required — can be an inline conditional in GamePage, or a small `ResultsView` sub-component extracted for clarity.

**Rationale**: Clarification Q1 confirmed inline approach. No routing change needed. Keeps the component tree simple.
