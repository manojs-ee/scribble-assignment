import { randomUUID } from "node:crypto";
import type { Guess, Participant, Point, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
let roomCreationCount = 0;

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  roomCreationCount += 1;
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    wordIndex: roomCreationCount % STARTER_WORDS.length,
    strokes: [],
    guesses: [],
    scores: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string): { error: "not_found" | "already_playing" } | { room: Room } {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" };
  }

  if (room.status === "playing") {
    return { error: "already_playing" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.currentWord = STARTER_WORDS[room.wordIndex] as string;
  room.strokes = [];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  saveRoom(room);

  return { room: cloneRoom(room) };
}

export function addStroke(code: string, points: Point[]): { error: "not_found" | "not_playing" } | { ok: true } {
  const room = rooms.get(code);
  if (!room) return { error: "not_found" };
  if (room.status !== "playing") return { error: "not_playing" };
  room.strokes.push(points);
  saveRoom(room);
  return { ok: true };
}

export function clearCanvas(code: string): { error: "not_found" | "not_playing" } | { ok: true } {
  const room = rooms.get(code);
  if (!room) return { error: "not_found" };
  if (room.status !== "playing") return { error: "not_playing" };
  room.strokes = [];
  saveRoom(room);
  return { ok: true };
}

export function submitGuess(
  code: string,
  participantId: string,
  text: string
): { error: "not_found" | "not_playing" | "already_finished" } | { guess: Guess; score: number } {
  const room = rooms.get(code);
  if (!room) return { error: "not_found" };
  if (room.status === "finished") return { error: "already_finished" };
  if (room.status !== "playing") return { error: "not_playing" };

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return { error: "not_found" };

  const currentScore = room.scores[participantId] ?? 0;
  const textMatches = text.trim().toLowerCase() === (room.currentWord ?? "").toLowerCase();
  const isCorrect = textMatches && currentScore < 100;

  if (isCorrect) {
    room.scores[participantId] = 100;
    room.status = "finished";
    room.winnerId = participantId;
  }

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);
  saveRoom(room);

  return { guess, score: room.scores[participantId] ?? 0 };
}

export function restartGame(code: string, requesterId: string): { error: "not_found" | "not_host" } | { ok: true } {
  const room = rooms.get(code);
  if (!room) return { error: "not_found" };
  if (room.hostId !== requesterId) return { error: "not_host" };
  if (room.status === "lobby") return { ok: true };

  room.status = "lobby";
  room.strokes = [];
  room.guesses = [];
  room.scores = {};
  room.currentWord = undefined;
  room.drawerId = undefined;
  room.winnerId = undefined;
  saveRoom(room);

  return { ok: true };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    winnerId: room.winnerId,
    strokes: room.strokes.map((stroke) => [...stroke]),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.drawerId && viewerParticipantId === room.drawerId) {
    snapshot.word = room.currentWord;
  }

  return snapshot;
}
