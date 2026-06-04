# Feature Specification: Drawing Canvas, Guessing & Scoring

**Feature Branch**: `003-canvas-guessing-scoring`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 3: Drawing Canvas, Guessing & Scoring. The drawer sees a drawing canvas they can draw on with a mouse/touch. There is a Clear Canvas button that wipes the drawing. Guessers see the canvas (read-only) updating via polling. Guessers can submit a guess via a text input and button. Each guess is recorded in a guess history visible to all players. If a guess matches the secret word (case-insensitive), it is marked as correct and that guesser gets 100 points. Incorrect guesses score 0. Scores are shown in a scoreboard visible to all players. All guess history and scores update via the existing polling on GET /rooms/:code. No WebSockets, no timers, no multiple rounds."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws on the Canvas (Priority: P1)

The drawer can draw freely on the canvas using a mouse or touch input. They can also clear the canvas at any time using a Clear Canvas button. The drawing state is broadcast to guessers via polling so they can see what is being drawn.

**Why this priority**: Without a drawable canvas there is no game. All other stories depend on the canvas existing. This is the central mechanic of Scribble.

**Independent Test**: Start a game in two tabs. In the drawer tab, draw something on the canvas and click Clear Canvas — the canvas clears. In the guesser tab, the canvas area updates within one polling cycle to reflect the drawer's current drawing state.

**Acceptance Scenarios**:

1. **Given** the game is in "playing" status and the current user is the drawer, **When** the game page loads, **Then** an interactive drawing canvas is displayed that responds to mouse drag and touch events.
2. **Given** the drawer is drawing, **When** they press and drag the mouse (or touch and drag), **Then** a continuous stroke is drawn on the canvas following the pointer path.
3. **Given** the drawer has drawn something, **When** they click "Clear Canvas", **Then** the canvas is wiped completely and the cleared state is reflected to guessers at next poll.
4. **Given** the current user is a guesser, **When** the game page loads, **Then** the canvas is displayed in read-only mode — no drawing interactions are possible.
5. **Given** the drawer has drawn strokes, **When** a guesser's polling interval fires, **Then** the guesser's canvas updates to show the current drawing state.

---

### User Story 2 - Guesser Submits a Guess (Priority: P2)

A guesser types a word into a guess input field and submits it. The guess is recorded in a visible guess history. If the guess matches the secret word (case-insensitive), it is marked as correct and the guesser is awarded 100 points. Incorrect guesses are recorded with 0 points.

**Why this priority**: Guessing is the core interaction for non-drawer players. Without it the game has no participation from guessers.

**Independent Test**: Start a game in two tabs. In the guesser tab, submit the correct word — the guess history shows it as correct and the scoreboard updates. Submit a wrong word — it appears in history as incorrect with no score change.

**Acceptance Scenarios**:

1. **Given** the current user is a guesser and the game is "playing", **When** the game page loads, **Then** a guess input field and submit button are visible and interactive.
2. **Given** a guesser types a word and submits, **When** the guess matches the secret word (case-insensitive), **Then** the guess is recorded as correct, the guesser receives 100 points, and the guess history shows it as a correct guess.
3. **Given** a guesser submits a word that does not match the secret word, **When** the guess is processed, **Then** the guess is recorded as incorrect with 0 points and appears in the guess history.
4. **Given** a guesser submits an empty or whitespace-only guess, **When** they click submit, **Then** the submission is rejected with an inline error and no network request is made.
5. **Given** the current user is the drawer, **When** the game page loads, **Then** the guess input is not shown (drawers do not guess).

---

### User Story 3 - Guess History & Scoreboard Visible to All (Priority: P3)

All players (drawer and guessers) can see the full guess history and the scoreboard, updated automatically via polling. Correct guesses are visually distinguished from incorrect ones.

**Why this priority**: Shared visibility of guesses and scores is what makes the game social and competitive. Without it players have no feedback on the game state.

**Independent Test**: Start a game in two tabs. Submit guesses from the guesser tab. Both tabs show the updated guess history and scoreboard within one polling cycle (≤2s).

**Acceptance Scenarios**:

1. **Given** guesses have been submitted, **When** any player's polling interval fires, **Then** the guess history displays all submitted guesses in chronological order with player name, guess text, and correct/incorrect status.
2. **Given** a correct guess has been submitted, **When** the scoreboard updates, **Then** the guesser's score shows 100 points and is visually distinguished from players with 0 points.
3. **Given** the game is in progress, **When** a new guess is submitted, **Then** both the drawer's view and all guesser views reflect the updated guess history and scores within ≤2 seconds.

---

### Edge Cases

- What happens if a guesser submits the same correct word twice? → The second submission is recorded but scores do not double — once a player has a correct guess their score stays at 100.
- What happens if the drawer submits a guess? → The guess input is not shown to the drawer; no server-side enforcement needed for this scenario.
- What happens if the guess input is empty or whitespace-only? → Rejected with an inline error before any network call.
- What happens if two guessers submit the correct word simultaneously? → Both are recorded as correct; both receive 100 points independently.
- What happens to the canvas if the page is refreshed? → The drawing state is lost on refresh; canvas is not persisted across page loads (in-memory only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game page MUST display an interactive drawing canvas to the drawer, accepting mouse-down/move/up and touch-start/move/end events to produce continuous strokes.
- **FR-002**: The drawer MUST have a "Clear Canvas" button that wipes all strokes from the canvas and resets the shared drawing state so guessers see a blank canvas at the next poll.
- **FR-003**: The canvas MUST be read-only for guessers — no drawing interaction is possible for non-drawer participants.
- **FR-004**: The drawing state (strokes) MUST be stored on the backend and included in `GET /rooms/:code` polling responses so guessers can render the current drawing.
- **FR-005**: Guessers MUST see a guess input field and submit button; the drawer MUST NOT see the guess input.
- **FR-006**: The system MUST expose a `POST /rooms/:code/guess` endpoint that accepts a participant ID and guess text, records the guess, evaluates correctness (case-insensitive match against the room's `currentWord`), and awards 100 points to the guesser if correct.
- **FR-007**: Submitted guesses MUST be appended to a persistent guess history on the backend (in-memory), each entry recording: participant ID, participant name, guess text, correctness, and timestamp.
- **FR-008**: The `GET /rooms/:code` polling response MUST include the full guess history and per-participant scores so all clients can render them without additional requests.
- **FR-009**: The guess history MUST be displayed to all players (drawer and guessers) in chronological order, showing player name, guess text, and a visual indicator of correct or incorrect.
- **FR-010**: A scoreboard MUST be visible to all players showing each participant's name and current score.
- **FR-011**: An empty or whitespace-only guess MUST be rejected on the frontend with an inline error message before any network request is made.
- **FR-012**: Once a participant has a correct guess (score = 100), subsequent correct guesses from the same participant do not increase their score further.

### Key Entities

- **Stroke**: A sequence of points drawn in a single mouse/touch drag. Stored as an array of `{x, y}` coordinate pairs. All strokes together form the canvas drawing state.
- **Guess**: A single guess submission. Fields: `participantId`, `participantName`, `text`, `isCorrect` (boolean), `timestamp`.
- **Score**: Per-participant integer, starting at 0. Set to 100 on first correct guess; does not increase further.
- **RoomSnapshot** (extended): Now includes `strokes` (array of stroke arrays), `guesses` (array of Guess), `scores` (map of participantId → score).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can produce a visible stroke on the canvas within one pointer event (no perceptible lag on the local machine).
- **SC-002**: A guesser's canvas reflects the drawer's current drawing state within one polling cycle (≤ 2 seconds).
- **SC-003**: A correct guess is reflected in the scoreboard and guess history for all players within one polling cycle (≤ 2 seconds) of submission.
- **SC-004**: Submitting an empty or whitespace-only guess always shows an error and never triggers a network request.
- **SC-005**: The scoreboard correctly shows 100 points for a correct guesser and 0 for all others after a correct guess is submitted.

## Assumptions

- Drawing state is stored in-memory on the backend as an array of strokes (each stroke = array of `{x, y}` points); it is not persisted across server restarts.
- The canvas size is fixed (not responsive to window resize) for simplicity; a reasonable default size (e.g. 600×400) is used.
- Stroke colour and brush size are fixed (single colour, single width) — no colour picker or brush controls are in scope.
- The drawer's local canvas renders immediately on pointer events; the backend stroke state is sent on each pointer-up (end of stroke) to avoid per-pixel polling overhead.
- The `GET /rooms/:code` response is extended to include `strokes`, `guesses`, and `scores`; no new polling endpoint is needed.
- A participant's `id` and `name` are available in frontend state (via `roomStore`) for attaching to guess submissions.
- Once a correct guess is made, the game continues (no auto-end, no round transition) — that is Scenario 4's concern.
- The drawer cannot submit guesses; this is enforced on the frontend only (no backend validation needed for this scenario).
- Scores start at 0 for all participants when the game starts; they are stored in the backend `Room` object as a `Map<participantId, score>`.
