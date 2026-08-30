# Copilot Instructions for this Sudoku project

## Project purpose
This repository contains a Flask-based Sudoku web app. The goal is to keep the game playable, polished, and easy to maintain while preserving the existing user experience and validation logic.

## Coding expectations
- Prefer small, focused changes over broad rewrites.
- Preserve the current app architecture: Flask backend + static HTML/CSS/JS frontend.
- Keep behavior consistent with the game rules and the existing tests.
- When changing logic, keep validation strict: empty cells should be treated as incorrect during checks unless the whole board is solved.
- Prefer clear, readable code with simple naming and direct logic.
- Do not add unnecessary dependencies or refactor unrelated code.

## UI and styling expectations
- Keep the design responsive and mobile-friendly.
- Preserve accessible contrast and readable text for both light and dark themes.
- Maintain a polished look with clear visual states for:
  - prefixed numbers
  - hints
  - invalid entries
  - completion modal and leaderboard
- Keep Sudoku sub-grid shading consistent and visually balanced.

## App behavior expectations
- Maintain the existing gameplay flow:
  - new puzzle
  - timer
  - hint system
  - check/validate action
  - win completion flow
  - leaderboard save in local storage
- Do not break browser-side invalid highlighting or backend correctness checks.
- Ensure completion only triggers when the entire board is correctly solved.
- Keep leaderboard entries sorted and capped to the top 10 results.

## Testing expectations
- Validate changes with the relevant pytest checks.
- If fixing a bug, prefer a targeted regression test or reproduce the issue with a minimal behavioral check.
- Do not claim a fix is complete without running the relevant test command.

## Preferred style
- Use existing project patterns before introducing new ones.
- Keep JavaScript functions simple and DOM-oriented.
- Use CSS variables for theme colors and reusable visual tokens.
- Favor incremental improvement over redesign unless the task explicitly asks for a styling refresh.

## Important constraints
- Keep the app working from the starter folder structure.
- Respect the existing test expectations and Flask route behavior.
- When asked to revert or adjust a feature, prefer restoring the prior behavior unless the user explicitly requests a new implementation.
