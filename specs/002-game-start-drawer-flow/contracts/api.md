# API Contracts: Game Start & Drawer Flow

## New endpoint

### POST /rooms/:code/start

Transitions a lobby room to playing state, assigns drawer, selects word.

**Request**
```
POST /rooms/:code/start
Content-Type: application/json
Body: {} (empty — no payload required)
```

**Success response — 200 OK**
```json
{
  "participantId": "<hostId>",
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "hostId": "<id>",
    "drawerId": "<hostId>",
    "word": "pizza",
    "availableWords": [...],
    "roles": [...]
  }
}
```
Note: `word` is always present in this response because the caller is the host/drawer.

**Error responses**
| Status | Condition |
|--------|-----------|
| 404 | Room code not found |
| 409 | Room is already in "playing" status |

---

## Modified endpoint

### GET /rooms/:code?participantId=\<id\>

`participantId` query param was already accepted by the schema (optional). Behaviour change: `toRoomSnapshot` now uses `viewerParticipantId` to conditionally include `word`.

**Response shape change**
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "hostId": "<id>",
    "drawerId": "<id>",
    "word": "pizza",        // present only when participantId === drawerId
    "availableWords": [...],
    "roles": [...]
  }
}
```

When `participantId` is absent or does not match `drawerId`, `word` is omitted from the response entirely (not `null`, not `""`).
