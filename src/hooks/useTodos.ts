import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { todoStore } from '../lib/todoStore'
import type { Filter, Todo, TodoDraft, TodoEdits, TodoId } from '../types'

export interface TodoCounts {
  all: number
  active: number
  completed: number
}

export interface UseTodosResult {
  todos: Todo[]
  visibleTodos: Todo[]
  counts: TodoCounts
  filter: Filter
  error: string | null
  setFilter: (filter: Filter) => void
  dismissError: () => void
  addTodo: (draft: TodoDraft) => void
  updateTodo: (id: TodoId, edits: TodoEdits) => void
  toggleTodo: (id: TodoId) => void
  deleteTodo: (id: TodoId) => void
  clearCompleted: () => void
  reorderTodo: (draggedId: TodoId, targetId: TodoId) => void
  moveTodoBy: (id: TodoId, offset: -1 | 1) => void
}

export function useTodos(): UseTodosResult {
  const { todos, error } = useSyncExternalStore(
    todoStore.subscribe,
    todoStore.getSnapshot,
  )
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo<TodoCounts>(
    () => ({
      all: todos.length,
      active: todos.filter((todo) => !todo.completed).length,
      completed: todos.filter((todo) => todo.completed).length,
    }),
    [todos],
  )

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed)
      case 'completed':
        return todos.filter((todo) => todo.completed)
      case 'all':
        return todos
    }
  }, [todos, filter])

  const addTodo = useCallback((draft: TodoDraft) => todoStore.addTodo(draft), [])
  const updateTodo = useCallback(
    (id: TodoId, edits: TodoEdits) => todoStore.updateTodo(id, edits),
    [],
  )
  const toggleTodo = useCallback((id: TodoId) => todoStore.toggleTodo(id), [])
  const deleteTodo = useCallback((id: TodoId) => todoStore.deleteTodo(id), [])
  const clearCompleted = useCallback(() => todoStore.clearCompleted(), [])
  const reorderTodo = useCallback(
    (draggedId: TodoId, targetId: TodoId) => todoStore.reorderTodo(draggedId, targetId),
    [],
  )
  const moveTodoBy = useCallback(
    (id: TodoId, offset: -1 | 1) => todoStore.moveTodoBy(id, offset),
    [],
  )
  const dismissError = useCallback(() => todoStore.dismissError(), [])

  return {
    todos,
    visibleTodos,
    counts,
    filter,
    error,
    setFilter,
    dismissError,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    reorderTodo,
    moveTodoBy,
  }
}
