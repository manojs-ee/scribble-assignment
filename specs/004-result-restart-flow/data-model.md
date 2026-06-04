# Data Model: Result State & Restart Flow

## Backend model changes (`backend/src/models/game.ts`)

### `RoomStatus` (extended)

```
"lobby" | "playing" | "finished"
```

Adding `"finished"` as a third value.

### `Room` (extended)

| Field | Type | Added? | Notes |
|---|---|---|---|
| `winnerId` | `string \| undefined` | **new** | Set when status → "finished"; cleared on restart |

All other `Room` fields unchanged.

### `RoomSnapshot` (extended)

| Field | Type | Added? | Visibility |
|---|---|---|---|
| `winnerId` | `string \| undefined` | **new** | all |

---

## Backend service changes (`backend/src/services/roomStore.ts`)

### `submitGuess()` (extended)

New guard added before existing logic:
```
if (room.status === "finished") return { error: "already_finished" }
```

New transition at end of correct-guess path:
```
if (isCorrect) {
  room.scores[participantId] = 100
  room.status = "finished"
  room.winnerId = participantId
}
```

### New function: `restartGame(code)`

```
restartGame(code: string):
  { error: "not_found" | "not_finished" } | { ok: true }

- Gets room; returns not_found if absent
- If room.status === "lobby": return { ok: true } (idempotent)
- Sets room.status = "lobby"
- Clears: strokes=[], guesses=[], scores={}, currentWord=undefined,
          drawerId=undefined, winnerId=undefined
- Calls saveRoom(room)
- Returns { ok: true }
```

---

## Frontend type changes (`frontend/src/services/api.ts`)

### `RoomSnapshot` (extended)

| Field | Type | Added? |
|---|---|---|
| `status` | `"lobby" \| "playing" \| "finished"` | extended |
| `winnerId` | `string \| undefined` | **new** |

---

## State transitions

```
Room lifecycle additions:
  submitGuess() with correct answer →
    status: "playing" → "finished"
    winnerId: participantId
    (scores, strokes, guesses unchanged — preserved for results display)

  restartGame() →
    status: "finished" → "lobby"
    winnerId: undefined
    currentWord: undefined
    drawerId: undefined
    strokes: []
    guesses: []
    scores: {}
    participants: unchanged
    wordIndex: unchanged (was set at room creation)
```
