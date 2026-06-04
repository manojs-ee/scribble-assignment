import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

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

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
  const canStart = isHost && room.participants.length >= 2;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}{participant.id === room.hostId ? " (Host)" : ""}</span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
            Ready to play
          </p>
          <p style={{ marginTop: '8px' }}>Waiting for the host to start the game.</p>
        </Card>
      </div>

      {isHost && (
        <div className="button-row button-row--spread">
          {startError ? <p className="form__error">{startError}</p> : null}
          <button
            className="button button--primary"
            disabled={!canStart}
            onClick={async () => {
              try {
                setStartError(null);
                await roomStore.startRoom();
                navigate("/game");
              } catch (err) {
                setStartError(err instanceof Error ? err.message : "Could not start game — try again");
              }
            }}
          >
            {canStart ? "Start Game" : "Waiting for players…"}
          </button>
        </div>
      )}
    </section>
  );
}
