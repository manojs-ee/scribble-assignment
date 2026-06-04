# Research: Drawing Canvas, Guessing & Scoring

## Decision 1: Canvas implementation — native HTML Canvas API

**Decision**: Use the native browser `<canvas>` element with the 2D context API. No new npm packages.

**Rationale**: The starter already ships no drawing library; adding one would violate the constitution's no-new-packages rule. The native canvas API is sufficient for single-colour freehand drawing: `mousedown`/`mousemove`/`mouseup` + `touchstart`/`touchmove`/`touchend` events drive `beginPath()`, `lineTo()`, `stroke()` calls. Clear is `clearRect()`.

**Alternatives considered**: Fabric.js, Konva, rough.js — all rejected (new packages, overkill for freehand-only drawing).

---

## Decision 2: Canvas size — fixed 600×400px

**Decision**: Canvas is fixed at 600px wide × 400px tall. Not responsive.

**Rationale**: Simplest implementation; no resize observer needed. Coordinates sent to backend are absolute pixels within this fixed frame so guessers can replay strokes exactly. The constitution forbids scope creep; responsive canvas would require coordinate normalisation.

**Alternatives considered**: `100% width` responsive — rejected (requires normalising coordinates to 0–1 range before storing, adds complexity).

---

## Decision 3: Stroke data format

**Decision**: A stroke is an array of `{x: number, y: number}` points captured on every `mousemove` while the button is held. Sent as a JSON array in `POST /rooms/:code/stroke` body on `mouseup`. Backend stores `room.strokes: Point[][]` (array of strokes, each stroke = array of points).

**Rationale**: Simple, self-contained, easy to replay on guesser canvas by iterating strokes and drawing each as a polyline. The entire stroke history is re-sent in every `GET /rooms/:code` response; guessers clear and redraw all strokes on each poll.

**Alternatives considered**: Delta encoding (only new strokes) — rejected (adds complexity; at this scale full redraw per poll is fine).

---

## Decision 4: Guesser canvas rendering

**Decision**: On each poll, guesser's canvas is fully cleared (`clearRect`) then all strokes from `room.strokes` are replayed in order. No diffing.

**Rationale**: Simple, correct, no state to synchronise. At ≤2s polling and small stroke counts this is imperceptible.

**Alternatives considered**: Incremental rendering (only draw new strokes since last poll) — rejected (requires tracking last-seen stroke index, adds state management complexity).

---

## Decision 5: Guess submission endpoint

**Decision**: `POST /rooms/:code/guess` with body `{ participantId, text }`. Backend trims and lowercases `text`, compares to `room.currentWord.toLowerCase()`. If match and participant score < 100: set score to 100, mark guess `isCorrect: true`. Otherwise `isCorrect: false`, score unchanged. Appends `Guess` to `room.guesses`.

**Rationale**: Consistent with existing endpoint pattern. `participantId` in body (not query param) since this is a POST mutation.

**Alternatives considered**: Passing `participantId` as a URL segment — rejected (inconsistent with existing patterns).

---

## Decision 6: Score cap enforcement

**Decision**: Backend checks `room.scores.get(participantId) ?? 0`. If already 100, sets `isCorrect: false` on new correct guesses (the word was already found by this player). Score is never incremented beyond 100.

**Rationale**: Prevents score farming. Clean rule: one 100-point award per player per game.

---

## Decision 7: `RoomSnapshot` extensions for polling

**Decision**: Add to `RoomSnapshot`:
- `strokes: Point[][]` — full stroke history (always included)
- `guesses: GuessSnapshot[]` — full guess history (always included)  
- `scores: Record<string, number>` — participantId → score (always included, all participants shown)

All three fields are included for every caller regardless of role. Strokes are non-sensitive. Scores and guesses are shared game state.

**Rationale**: No per-caller filtering needed (unlike `word`). Simpler implementation.
