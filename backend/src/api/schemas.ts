import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, { message: "Room code is required" })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const strokeSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1)
});

export const guessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string().min(1)
});

export const restartSchema = z.object({
  participantId: z.string().min(1)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
