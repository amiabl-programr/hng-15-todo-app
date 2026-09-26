import { useState } from 'react'
import { FilterBar } from './components/FilterBar'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import type { TodoDraft, TodoId } from './types'
import './App.css'

const EMPTY_DRAFT: TodoDraft = { title: '', dueDate: null }

const EMPTY_MESSAGES = {
  all: 'No tasks yet. Add your first one above.',
  active: 'Nothing active. Everything is done.',
  completed: 'No completed tasks yet.',
} as const

export default function App() {
  const {
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
  } = useTodos()

  const [draft, setDraft] = useState<TodoDraft>(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState<TodoId | null>(null)

  const editingTodo = todos.find((todo) => todo.id === editingId) ?? null

  function handleSubmit() {
    if (editingTodo === null) {
      addTodo(draft)
    } else {
      updateTodo(editingTodo.id, draft)
      setEditingId(null)
    }
    setDraft(EMPTY_DRAFT)
  }

  function handleStartEdit(id: TodoId) {
    const todo = todos.find((candidate) => candidate.id === id)
    if (todo === undefined) {
      return
    }
    setEditingId(todo.id)
    setDraft({ title: todo.title, dueDate: todo.dueDate })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className="app">
      <header className="app__header">
        <img className="app__logo" src="/logo.svg" width="32" height="32" alt="" />
        <h1 className="app__title">Tasks</h1>
        <p className="app__subtitle">
          {counts.active === 0 && counts.all > 0
            ? 'All caught up.'
            : `${counts.active} ${counts.active === 1 ? 'task' : 'tasks'} left`}
        </p>
      </header>

      {error !== null && (
        <div className="app__error" role="alert">
          <span>{error}</span>
          <button className="app__error-dismiss" type="button" onClick={dismissError}>
            Dismiss
          </button>
        </div>
      )}

      <section className="app__panel">
        <TodoForm
          draft={draft}
          editingTodo={editingTodo}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
        />
      </section>

      <FilterBar
        filter={filter}
        counts={counts}
        completedCount={counts.completed}
        onFilterChange={setFilter}
        onClearCompleted={clearCompleted}
      />

      <TodoList
        todos={visibleTodos}
        emptyMessage={EMPTY_MESSAGES[filter]}
        onToggle={toggleTodo}
        onEdit={handleStartEdit}
        onDelete={deleteTodo}
        onReorder={reorderTodo}
        onMoveBy={moveTodoBy}
      />
    </div>
  )
}
