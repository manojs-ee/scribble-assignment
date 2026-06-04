# API Contracts: Room Setup & Lobby

Base URL: `http://localhost:3001`

---

## POST /rooms — Create Room

**Request**
```json
{ "playerName": "string (optional)" }
```

**Response 201**
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [{ "id": "uuid", "name": "string", "joinedAt": "iso" }],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Change from starter**: `room` now includes `hostId`.

---

## POST /rooms/:code/join — Join Room

**Request**
```json
{ "playerName": "string (optional)" }
```

**Response 200**
```json
{
  "participantId": "uuid",
  "room": { "...same shape as create..." }
}
```

**Error 400** — empty or whitespace-only code
```json
{ "message": "Room code is required" }
```

**Error 404** — code not found
```json
{ "message": "Room not found — check your code and try again" }
```

**Change from starter**: specific error messages; `room` includes `hostId`.

---

## GET /rooms/:code — Fetch Room Snapshot (used for polling)

**Query params**: `participantId` (optional)

**Response 200**
```json
{
  "room": { "...same shape as above..." }
}
```

**Error 404**
```json
{ "message": "Unable to load room" }
```

**No change to endpoint** — only response shape adds `hostId`.
