# Reflection

## What I Built

I implemented all four scenarios of the Scribble multiplayer drawing game:

- **Scenario 1**: Room setup and lobby — create/join rooms, host label, polling, Start Game button
- **Scenario 2**: Game start and drawer flow — POST /start endpoint, deterministic word selection, drawer/guesser role display, player name validation
- **Scenario 3**: Drawing canvas, guessing and scoring — native HTML canvas, stroke transmission, guess submission, scoreboard, guess history
- **Scenario 4**: Result state and restart flow — finished status on correct guess, results screen, Play Again button, room reset

## AI Usage

I used Claude Code with the speckit workflow throughout this project. For each scenario I followed the full cycle: specify → clarify → plan → checklist → tasks → analyze → implement.

Claude Code generated spec artifacts, plan documents, and implementation code. I reviewed each artifact before committing and verified the implementation worked correctly in two browser tabs before moving to the next scenario.

## What I Reviewed

- All generated spec and plan documents were checked against the README rubric and the project constitution before committing
- Implementation code was reviewed line by line before each commit — I caught and fixed issues including the guesser not auto-navigating to the game page after the host started (missing `useEffect` on `room.status`), and a TypeScript type error in the `submitGuess` return type after adding the `already_finished` guard
- The constitution's constraints (no WebSockets, no database, deterministic word selection, polling only) were verified at each step

## What I Learned

Working within a strict brownfield constraint — extending existing files rather than rewriting — required careful reading of the starter code before making any change. The speckit workflow helped maintain traceability between requirements and implementation across all four scenarios.
