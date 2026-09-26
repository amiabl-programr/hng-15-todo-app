import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Todo, TodoDraft } from '../types'
import './TodoForm.css'

export interface TodoFormProps {
  draft: TodoDraft
  editingTodo: Todo | null
  onDraftChange: (draft: TodoDraft) => void
  onSubmit: () => void
  onCancelEdit: () => void
}

export function TodoForm({
  draft,
  editingTodo,
  onDraftChange,
  onSubmit,
  onCancelEdit,
}: TodoFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const editingId = editingTodo?.id ?? null
  const [lastEditingId, setLastEditingId] = useState(editingId)

  // Switching between tasks invalidates the previous validation message.
  // Adjusting state during render is the supported alternative to an effect here.
  if (editingId !== lastEditingId) {
    setLastEditingId(editingId)
    setValidationError(null)
  }

  const isEditing = editingTodo !== null
  const trimmedTitle = draft.title.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (trimmedTitle.length === 0) {
      setValidationError('Give the task a title before saving.')
      return
    }

    setValidationError(null)
    onSubmit()
  }

  function handleCancelEdit() {
    setValidationError(null)
    onCancelEdit()
  }

  return (
    <form
      className="todo-form"
      onSubmit={handleSubmit}
      aria-label={isEditing ? 'Edit task' : 'Add a task'}
    >
      <div className="todo-form__fields">
        <div className="todo-form__field todo-form__field--grow">
          <label className="todo-form__label" htmlFor="todo-title">
            Title
          </label>
          <input
            id="todo-title"
            className="todo-form__input"
            type="text"
            value={draft.title}
            placeholder="What needs doing?"
            autoComplete="off"
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
        </div>

        <div className="todo-form__field">
          <label className="todo-form__label" htmlFor="todo-due-date">
            Due date
          </label>
          <input
            id="todo-due-date"
            className="todo-form__input"
            type="date"
            value={draft.dueDate ?? ''}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                dueDate: event.target.value === '' ? null : event.target.value,
              })
            }
          />
        </div>

        <div className="todo-form__actions">
          <button className="todo-form__submit" type="submit">
            {isEditing ? 'Save changes' : 'Add task'}
          </button>
          {isEditing && (
            <button className="todo-form__cancel" type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {validationError !== null && (
        <p className="todo-form__error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  )
}
