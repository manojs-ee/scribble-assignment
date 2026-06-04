# Data Model: Room Setup & Lobby

## Entities

### Room (backend, in-memory)

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Unique 4-char room identifier (A-Z, 2-9) |
| `status` | `"lobby"` | Room lifecycle state (expands in Scenario 2) |
| `participants` | `Participant[]` | All players in the room |
| `hostId` | `string` | UUID of the host participant — set at creation, never changes |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp — updated on every mutation |

### Participant (backend, in-memory)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID — stable identity token for this player |
| `name` | `string` | Display name (trimming deferred to Scenario 2) |
| `joinedAt` | `string` | ISO timestamp |

### RoomSnapshot (API response shape — both backend and frontend)

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Room code |
| `status` | `"lobby"` | Room status |
| `participants` | `Participant[]` | Current participant list |
| `hostId` | `string` | Host participant UUID — new in Scenario 1 |
| `availableWords` | `string[]` | Seed word list (used in Scenario 2) |
| `roles` | `ParticipantRole[]` | Seed roles (used in Scenario 2) |

## State Transitions (Scenario 1 scope)

```
[room created] → status: "lobby", hostId set
[player joins] → participants array grows, hostId unchanged
[host clicks Start] → (Scenario 2 scope)
```

## Key Rules

- `hostId` is set once at `createRoom()` and is immutable for the room's lifetime.
- A `Participant.id` is a UUID generated server-side and returned to the client once at create/join time.
- The frontend identifies the current viewer's host status as: `room.hostId === participantId` where `participantId` comes from the `RoomSessionResponse`.
