# API Contracts: Drawing Canvas, Guessing & Scoring

## New endpoints

### POST /rooms/:code/stroke

Appends one completed stroke to the room's drawing state.

**Request**
```
POST /rooms/:code/stroke
Content-Type: application/json
Body: { "points": [{"x": 10, "y": 20}, {"x": 15, "y": 25}, ...] }
```

**Success — 200 OK**
```json
{ "ok": true }
```

**Error responses**
| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 409 | Room not in "playing" status |

---

### POST /rooms/:code/clear-canvas

Clears all strokes from the room's drawing state.

**Request**
```
POST /rooms/:code/clear-canvas
Content-Type: application/json
Body: {} (empty)
```

**Success — 200 OK**
```json
{ "ok": true }
```

**Error responses**
| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 409 | Room not in "playing" status |

---

### POST /rooms/:code/guess

Submits a guess from a participant.

**Request**
```
POST /rooms/:code/guess
Content-Type: application/json
Body: { "participantId": "<id>", "text": "pizza" }
```

**Success — 200 OK**
```json
{
  "guess": {
    "id": "<uuid>",
    "participantId": "<id>",
    "participantName": "Alice",
    "text": "pizza",
    "isCorrect": true,
    "timestamp": "2026-06-04T12:00:00.000Z"
  },
  "score": 100
}
```

**Error responses**
| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 400 | Missing participantId or text |
| 409 | Room not in "playing" status |

---

## Modified endpoint

### GET /rooms/:code?participantId=\<id\>

**Response shape additions** (new fields in `room` object):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "hostId": "<id>",
    "drawerId": "<id>",
    "word": "pizza",
    "strokes": [
      [{"x": 10, "y": 20}, {"x": 15, "y": 25}],
      [{"x": 50, "y": 60}, {"x": 55, "y": 65}]
    ],
    "guesses": [
      {
        "id": "<uuid>",
        "participantId": "<id>",
        "participantName": "Bob",
        "text": "castle",
        "isCorrect": false,
        "timestamp": "2026-06-04T12:00:01.000Z"
      }
    ],
    "scores": {
      "<participantId1>": 0,
      "<participantId2>": 100
    },
    "availableWords": [...],
    "roles": [...]
  }
}
```

`strokes`, `guesses`, and `scores` are always included for all callers (no per-role filtering).
