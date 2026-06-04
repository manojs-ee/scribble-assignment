import { Router } from "express";
import {
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  strokeSchema
} from "./schemas.js";
import { addStroke, clearCanvas, createRoom, getRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Room not found — check your code and try again");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/stroke", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { points } = strokeSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), points);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found — check your code and try again");
        throw new HttpError(409, "Game is not in progress");
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear-canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = clearCanvas(code.toUpperCase());

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found — check your code and try again");
        throw new HttpError(409, "Game is not in progress");
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room or participant not found");
        if (result.error === "already_finished") throw new HttpError(409, "Game has already finished");
        throw new HttpError(409, "Game is not in progress");
      }

      response.json({ guess: result.guess, score: result.score });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = restartGame(code.toUpperCase());

      if ("error" in result) {
        throw new HttpError(404, "Room not found — check your code and try again");
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = startGame(code.toUpperCase());

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Room not found — check your code and try again");
        }
        throw new HttpError(409, "Game has already started");
      }

      response.json({
        participantId: result.room.drawerId,
        room: toRoomSnapshot(result.room, result.room.drawerId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
