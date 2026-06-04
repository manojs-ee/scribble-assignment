# API Contracts: Result State & Restart Flow

## New endpoint

### POST /rooms/:code/restart

Resets a finished room back to lobby state.

**Request**
```
POST /rooms/:code/restart
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

Note: Calling restart on a room already in "lobby" status returns 200 `{ ok: true }` (idempotent).

---

## Modified endpoint

### POST /rooms/:code/guess

**New error response** (in addition to existing 404/400/409):
| Status | Condition |
|--------|-----------|
| 409 | Room is in "finished" status — game is over, no more guesses accepted |

**Response change on correct guess** — when the guess triggers game end, the response now reflects updated room state. The existing `{ guess, score }` response shape is unchanged; the client detects game end via the next `GET /rooms/:code` poll.

---

## Modified endpoint

### GET /rooms/:code?participantId=\<id\>

**Response shape additions** (new fields in `room` object):

```json
{
  "room": {
    "code": "ABCD",
    "status": "finished",
    "participants": [...],
    "hostId": "<id>",
    "drawerId": "<id>",
    "winnerId": "<id>",
    "word": "pizza",
    "strokes": [...],
    "guesses": [...],
    "scores": { "<id1>": 100, "<id2>": 0 },
    "availableWords": [...],
    "roles": [...]
  }
}
```

`winnerId` is `undefined` (omitted from JSON) when the game has not finished. `status` can now be `"lobby"`, `"playing"`, or `"finished"`.
