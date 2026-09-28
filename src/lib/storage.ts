import type { Todo } from '../types'

const STORAGE_KEY = 'hng15.todos.v1'

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.notes === 'string' &&
    typeof candidate.completed === 'boolean' &&
    (typeof candidate.dueDate === 'string' || candidate.dueDate === null) &&
    typeof candidate.createdAt === 'number'
  )
}

/**
 * Reads persisted todos. Throws when the stored payload is unreadable or has an
 * unexpected shape, so the caller can surface the problem instead of silently
 * starting from an empty list.
 */
export function readTodos(): Todo[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    return []
  }

  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Expected "${STORAGE_KEY}" to hold an array of todos but found ${typeof parsed}.`,
    )
  }

  const candidates: unknown[] = parsed
  return candidates.filter(isTodo)
}

export function writeTodos(todos: readonly Todo[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
