import { useState } from "react";

interface GuessFormProps {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (trimmed.length === 0) {
      setGuessError("Guess cannot be empty");
      return;
    }
    try {
      await onSubmit(trimmed);
      setGuessText("");
      setGuessError(null);
    } catch {
      setGuessError("Could not submit guess — try again");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => { setGuessText(event.target.value); setGuessError(null); }}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {guessError ? <p className="form__error">{guessError}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
