# Data Model: Game Start & Drawer Flow

## Backend model changes (`backend/src/models/game.ts`)

### `RoomStatus` (extended)

```
"lobby" | "playing"
```

Currently only `"lobby"`. Adding `"playing"` as the second value.

### `Room` (extended)

| Field | Type | Added? | Notes |
|---|---|---|---|
| `code` | `string` | existing | Room identifier |
| `status` | `RoomStatus` | extended | `"lobby"` → `"playing"` on game start |
| `participants` | `Participant[]` | existing | |
| `hostId` | `string` | existing | Participant ID of room creator |
| `drawerId` | `string \| undefined` | **new** | Set to `hostId` on game start |
| `currentWord` | `string \| undefined` | **new** | Selected word; set on game start |
| `wordIndex` | `number` | **new** | Captured at room creation: `roomCreationCount % STARTER_WORDS.length` |
| `createdAt` | `string` | existing | |
| `updatedAt` | `string` | existing | |

### `RoomSnapshot` (extended)

| Field | Type | Added? | Visibility |
|---|---|---|---|
| `code` | `string` | existing | all |
| `status` | `RoomStatus` | extended | all |
| `participants` | `Participant[]` | existing | all |
| `hostId` | `string` | existing | all |
| `drawerId` | `string \| undefined` | **new** | all |
| `word` | `string \| undefined` | **new** | drawer only (when `viewerParticipantId === drawerId`) |
| `availableWords` | `string[]` | existing | all (kept for backwards compat) |
| `roles` | `ParticipantRole[]` | existing | all (kept for backwards compat) |

### `roomStore.ts` module-level state

```
let roomCreationCount = 0;   // incremented in createRoom(), used for wordIndex
```

---

## Frontend type changes (`frontend/src/services/api.ts`)

### `RoomSnapshot` (extended)

| Field | Type | Added? | Notes |
|---|---|---|---|
| `status` | `"lobby" \| "playing"` | extended | was `"lobby"` only |
| `drawerId` | `string \| undefined` | **new** | |
| `word` | `string \| undefined` | **new** | only present for drawer |

---

## State transitions

```
Room lifecycle:
  created → status: "lobby", drawerId: undefined, currentWord: undefined
  POST /rooms/:code/start → status: "playing", drawerId: hostId, currentWord: STARTER_WORDS[wordIndex]

Validation guards:
  POST /rooms/:code/start on a "playing" room → 409 Conflict
  POST /rooms/:code/start on unknown room code → 404 Not Found
```

---

## Word selection rule

```
At createRoom() time:
  roomCreationCount += 1
  room.wordIndex = roomCreationCount % STARTER_WORDS.length

At startGame() time:
  room.currentWord = STARTER_WORDS[room.wordIndex]
```

First room ever: `wordIndex = 1 % 5 = 1` → "pizza"  
Second room ever: `wordIndex = 2 % 5 = 2` → "castle"  
(Resets on server restart, fully reproducible.)
