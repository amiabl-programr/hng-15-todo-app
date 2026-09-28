import { readTodos, writeTodos } from './storage'
import { sanitizeNotes, sanitizeTitle } from './sanitize'
import type { Todo, TodoDraft, TodoEdits, TodoId } from '../types'

export interface TodoStoreState {
  todos: Todo[]
  error: string | null
}

type Listener = () => void

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

/** Runs once on module load, so the first render already has the persisted todos. */
function hydrate(): TodoStoreState {
  try {
    return { todos: readTodos(), error: null }
  } catch (cause) {
    return {
      todos: [],
      error: `Could not load your saved todos, so this session starts empty. (${describe(cause)})`,
    }
  }
}

let state: TodoStoreState = hydrate()
const listeners = new Set<Listener>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function commit(todos: Todo[]): void {
  let error: string | null = null
  try {
    writeTodos(todos)
  } catch (cause) {
    error = `Changes could not be saved, so they will be lost on reload. (${describe(cause)})`
  }
  state = { todos, error }
  notify()
}

/** True when `next` holds exactly the same todos in the same order. */
function isUnchanged(current: Todo[], next: Todo[]): boolean {
  return current.length === next.length && current.every((todo, index) => todo === next[index])
}

/**
 * Applies a recipe to the current todos. A recipe that leaves the list unchanged
 * is dropped here, which keeps pointless localStorage writes and subscriber
 * notifications out of no-op actions like deleting an unknown id.
 */
function update(recipe: (todos: Todo[]) => Todo[]): void {
  const current = state.todos
  const next = recipe(current)
  if (next === current || isUnchanged(current, next)) {
    return
  }
  commit(next)
}

function move(todos: Todo[], from: number, to: number): Todo[] {
  const next = [...todos]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) {
    return todos
  }
  next.splice(to, 0, moved)
  return next
}

/**
 * Every write funnels through here, so text is sanitized no matter which caller
 * gets there. An empty title is a programming error rather than a user error —
 * `validateDraft` already rejects it in the UI — so it throws instead of quietly
 * storing a blank card.
 */
function requireTitle(raw: string): string {
  const title = sanitizeTitle(raw)
  if (title.length === 0) {
    throw new Error('Refusing to store a todo whose title is empty after sanitizing.')
  }
  return title
}

export const todoStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  getSnapshot(): TodoStoreState {
    return state
  },

  dismissError(): void {
    if (state.error !== null) {
      state = { todos: state.todos, error: null }
      notify()
    }
  },

  addTodo(draft: TodoDraft): void {
    update((todos) => [
      ...todos,
      {
        id: crypto.randomUUID(),
        title: requireTitle(draft.title),
        notes: sanitizeNotes(draft.notes),
        dueDate: draft.dueDate,
        completed: false,
        createdAt: Date.now(),
      },
    ])
  },

  updateTodo(id: TodoId, edits: TodoEdits): void {
    update((todos) =>
      todos.map((todo) => {
        if (todo.id !== id) {
          return todo
        }
        const title = edits.title === undefined ? todo.title : requireTitle(edits.title)
        const notes = edits.notes === undefined ? todo.notes : sanitizeNotes(edits.notes)
        return { ...todo, ...edits, title, notes }
      }),
    )
  },

  toggleTodo(id: TodoId): void {
    update((todos) =>
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  },

  deleteTodo(id: TodoId): void {
    update((todos) => todos.filter((todo) => todo.id !== id))
  },

  clearCompleted(): void {
    update((todos) => todos.filter((todo) => !todo.completed))
  },

  reorderTodo(draggedId: TodoId, targetId: TodoId): void {
    update((todos) => {
      const from = todos.findIndex((todo) => todo.id === draggedId)
      const to = todos.findIndex((todo) => todo.id === targetId)
      if (from === -1 || to === -1 || from === to) {
        return todos
      }
      return move(todos, from, to)
    })
  },

  moveTodoBy(id: TodoId, offset: -1 | 1): void {
    update((todos) => {
      const from = todos.findIndex((todo) => todo.id === id)
      const to = from + offset
      if (from === -1 || to < 0 || to >= todos.length) {
        return todos
      }
      return move(todos, from, to)
    })
  },
}
