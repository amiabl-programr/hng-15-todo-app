# Todo App — Build Plan

Spec lives in `notes.md`. This file tracks the build order. Work lands as one
atomic commit per step so any step can be reviewed or reverted on its own.

## Ground rules being followed
- No `any`; unknown data is typed `unknown` and narrowed with type guards.
- Errors are surfaced (an `error` banner in the UI), never swallowed by a bare `try/catch`.
- No new dependencies — drag-to-reorder, filtering and persistence are hand-rolled.
- Ambiguous scope was confirmed with the requester: CRUD + filtering + due dates + drag-to-reorder are all in scope.

## Steps

| # | Step | Files | Status |
|---|------|-------|--------|
| 1 | Domain types | `src/types.ts` | done |
| 2 | localStorage persistence with explicit failure | `src/lib/storage.ts` | done |
| 3 | Due-date helpers (parse, format, today, overdue) | `src/lib/dueDate.ts` | done |
| 4 | `useTodos` hook — CRUD, filter, reorder, persistence | `src/hooks/useTodos.ts` | pending |
| 5 | Add / edit form | `src/components/TodoForm.tsx` + `.css` | pending |
| 6 | Filter bar with counts | `src/components/FilterBar.tsx` + `.css` | pending |
| 7 | Todo card | `src/components/TodoCard.tsx` + `.css` | pending |
| 8 | List with drag-to-reorder + exit animation | `src/components/TodoList.tsx` + `.css` | pending |
| 9 | App shell composition | `src/App.tsx`, `src/App.css` | pending |
| 10 | Verify: lint, typecheck, production build | — | pending |

## Data model
Array order *is* display order, so reordering is just an array move and needs no
`order` field. `dueDate` is a local `YYYY-MM-DD` string or `null`; comparing those
keys lexicographically is equivalent to comparing calendar days.

## Decisions worth flagging
- **One form for add and edit.** Editing reuses the top form (prefilled, with a
  cancel button) instead of swapping each card into an inline editor. Fewer moving
  parts, one validation path.
- **Reorder by id, not index.** Drag handlers pass ids so reordering stays correct
  while a filter is hiding some cards.
- **Keyboard reordering.** The drag handle is a real `<button>`; ArrowUp/ArrowDown
  move the card, so reordering is not mouse-only.
- **Delete is deferred by one frame** (160ms) so the exit animation can play before
  the item leaves state.
