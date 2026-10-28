# Test fixtures

Trimmed snippets of real LinkedIn game-page HTML (captured 2026-10-26), with the
member ID replaced by a placeholder. Only the parts the extractor reads are kept.

- `zip-solved.html` — new page format (also used by Queens, Tango, Patches, Wend). Zip #588, solved in 0:08.
- `crossclimb-solved.html` — old page format (also used by Mini Sudoku). Crossclimb #909, solved in 0:19.

- `zip-unplayed.html` — new format, Zip #590 not yet played (captured 2026-10-28). The time is 0
  and the completion flags are present with default values; `mostRecentGameState` is `$undefined`.
- `crossclimb-unplayed.html` — old format, Crossclimb #911 not yet played. `timeElapsed` is null.

In-progress (started but unsolved) games aren't captured or handled, by choice.
