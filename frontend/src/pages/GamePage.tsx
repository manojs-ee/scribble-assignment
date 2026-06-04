import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [room?.code, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [room?.status, navigate]);

  if (!room) {
    return null;
  }

  const isDrawer = room.drawerId === participantId;
  const isHost = room.hostId === participantId;
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  if (room.status === "finished") {
    const winner = room.participants.find((p) => p.id === room.winnerId);
    const winningGuess = [...(room.guesses ?? [])].reverse().find((g) => g.isCorrect);
    const secretWord = winningGuess?.text ?? "";

    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Game Over</span>
            <h1 className="game-page__title">Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="summary-grid">
          <Card title="Winner">
            <dl className="detail-list">
              <div>
                <dt>Player</dt>
                <dd style={{ fontSize: "1.25rem", fontWeight: 700 }}>{winner?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Secret Word</dt>
                <dd style={{ fontSize: "1.25rem", fontWeight: 700 }}>{secretWord}</dd>
              </div>
            </dl>
          </Card>

          <Scoreboard participants={room.participants} scores={room.scores ?? {}} />
        </div>

        <div className="button-row">
          {isHost ? (
            <button
              className="button button--primary"
              onClick={async () => {
                try { await roomStore.restartGame(); } catch {}
              }}
            >
              Play Again
            </button>
          ) : (
            <p style={{ color: "#6b7280" }}>Waiting for the host to start a new game...</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores ?? {}} />
          <ResultPanel guesses={room.guesses ?? []} />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? `Draw: ${room.word ?? ""}` : "Canvas"}>
            <DrawingCanvas
              strokes={room.strokes ?? []}
              isDrawer={isDrawer}
              onStroke={async (points) => {
                try { await roomStore.addStroke(points); } catch {}
              }}
              onClear={async () => {
                try { await roomStore.clearCanvas(); } catch {}
              }}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm
                onSubmit={async (text) => { await roomStore.submitGuess(text); }}
                disabled={false}
              />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
