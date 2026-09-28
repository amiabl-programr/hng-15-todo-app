import { useState } from 'react'
import { FilterBar } from './components/FilterBar'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import type { TodoDraft, TodoId } from './types'
import './App.css'

const EMPTY_DRAFT: TodoDraft = { title: '', notes: '', dueDate: null }

const EMPTY_MESSAGES = {
  all: 'No tasks yet. Add your first one above.',
  active: 'Nothing active. Everything is done.',
  completed: 'No completed tasks yet.',
} as const

const REPO_URL = 'https://github.com/amiabl-programr/hng-15-todo-app'

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
    setDraft({ title: todo.title, notes: todo.notes, dueDate: todo.dueDate })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__heading">
          <img className="app__logo" src="/logo.svg" width="32" height="32" alt="" />
          <h1 className="app__title">Tasks</h1>
        </div>
        <p className="app__subtitle">
          {counts.active === 0 && counts.all > 0
            ? 'All caught up.'
            : `${counts.active} ${counts.active === 1 ? 'task' : 'tasks'} left`}
        </p>

        <div className="app__meta">
          <p className="app__credit">
           
            Made with  
            <svg
              className="app__heart-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg> by Victor
          </p>
          <a
            className="app__star"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="app__star-icon"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.418A.75.75 0 0 1 8 .25Z"
              />
            </svg>
            Star on GitHub
          </a>
        </div>
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
