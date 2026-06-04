# Data Model: Drawing Canvas, Guessing & Scoring

## Backend model changes (`backend/src/models/game.ts`)

### New types

```
Point = { x: number; y: number }
Stroke = Point[]   // one continuous drag gesture

Guess = {
  id: string           // randomUUID()
  participantId: string
  participantName: string
  text: string         // original casing preserved for display
  isCorrect: boolean
  timestamp: string    // ISO 8601
}
```

### `Room` (extended)

| Field | Type | Added? | Notes |
|---|---|---|---|
| `strokes` | `Point[][]` | **new** | Appended on `POST /stroke`; cleared on `POST /clear-canvas` |
| `guesses` | `Guess[]` | **new** | Appended on `POST /guess` |
| `scores` | `Record<string, number>` | **new** | Initialised to `{ [participantId]: 0 }` for all participants on `startGame()` |

### `RoomSnapshot` (extended)

| Field | Type | Added? | Visibility |
|---|---|---|---|
| `strokes` | `Point[][]` | **new** | all |
| `guesses` | `GuessSnapshot[]` | **new** | all |
| `scores` | `Record<string, number>` | **new** | all |

`GuessSnapshot` is identical to `Guess` — no filtering needed.

---

## Frontend type changes (`frontend/src/services/api.ts`)

### New types

```typescript
interface Point { x: number; y: number }

interface GuessSnapshot {
  id: string
  participantId: string
  participantName: string
  text: string
  isCorrect: boolean
  timestamp: string
}
```

### `RoomSnapshot` (extended)

| Field | Type | Added? |
|---|---|---|
| `strokes` | `Point[][]` | **new** |
| `guesses` | `GuessSnapshot[]` | **new** |
| `scores` | `Record<string, number>` | **new** |

---

## State transitions

```
Room lifecycle additions:
  startGame()     → room.scores = { p1: 0, p2: 0, ... } for all participants
                    room.strokes = []
                    room.guesses = []

  addStroke()     → room.strokes.push(stroke)
  clearCanvas()   → room.strokes = []
  submitGuess()   → room.guesses.push(guess)
                    if isCorrect && room.scores[pid] < 100:
                      room.scores[pid] = 100
```

---

## Canvas coordinate system

- Fixed 600×400px canvas
- Origin (0,0) at top-left
- Points are absolute pixel coordinates
- Guesser canvas: `clearRect(0,0,600,400)` then replay all strokes as polylines on each poll
