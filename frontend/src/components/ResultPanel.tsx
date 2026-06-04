import type { GuessSnapshot } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessSnapshot[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      ) : (
        <ul className="player-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
          {guesses.map((g) => (
            <li key={g.id}>
              <span>{g.participantName}: {g.text}</span>
              <strong style={{ color: g.isCorrect ? "#16a34a" : "#dc2626" }}>
                {g.isCorrect ? "✓" : "✗"}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
