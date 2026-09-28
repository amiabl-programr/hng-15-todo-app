import { useState } from 'react'
import { formatDateKey, isPastDue, isToday } from '../lib/dueDate'
import type { Todo } from '../types'
import './TodoCard.css'

/** Notes longer than this in either dimension get a show more / show less toggle. */
const COLLAPSED_LINES = 2
const COLLAPSED_CHARS = 100

export interface TodoCardProps {
  todo: Todo
  position: number
  total: number
  isDragging: boolean
  isDropTarget: boolean
  isRemoving: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDrop: () => void
  onDragEnd: () => void
  onMoveBy: (offset: -1 | 1) => void
}

type DueTone = 'none' | 'overdue' | 'today' | 'upcoming'

function dueTone(todo: Todo): DueTone {
  if (todo.dueDate === null) {
    return 'none'
  }
  if (isPastDue(todo.dueDate)) {
    return 'overdue'
  }
  return isToday(todo.dueDate) ? 'today' : 'upcoming'
}

export function TodoCard({
  todo,
  position,
  total,
  isDragging,
  isDropTarget,
  isRemoving,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
  onMoveBy,
}: TodoCardProps) {
  const tone = dueTone(todo)
  const isFirst = position === 0
  const isLast = position === total - 1
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)

  const hasNotes = todo.notes.length > 0
  const isNotesLong =
    todo.notes.split('\n').length > COLLAPSED_LINES || todo.notes.length > COLLAPSED_CHARS

  const className = [
    'todo-card',
    todo.completed ? 'todo-card--completed' : '',
    isDragging ? 'todo-card--dragging' : '',
    isDropTarget ? 'todo-card--drop-target' : '',
    isRemoving ? 'todo-card--removing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className="todo-card__slot">
      <article
        className={className}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          onDragStart()
        }}
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          onDrop()
        }}
        onDragEnd={onDragEnd}
      >
        <button
          className="todo-card__handle"
          type="button"
          aria-label={`Reorder ${todo.title}. Position ${position + 1} of ${total}.`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' && !isFirst) {
              event.preventDefault()
              onMoveBy(-1)
            }
            if (event.key === 'ArrowDown' && !isLast) {
              event.preventDefault()
              onMoveBy(1)
            }
          }}
        >
          <span aria-hidden="true">⠿</span>
        </button>

        <input
          className="todo-card__checkbox"
          type="checkbox"
          checked={todo.completed}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'complete'}`}
          onChange={onToggle}
        />

        <div className="todo-card__body">
          <p className="todo-card__title">{todo.title}</p>
          {todo.dueDate !== null && (
            <p className={`todo-card__due todo-card__due--${tone}`}>
              {tone === 'overdue' ? 'Overdue · ' : tone === 'today' ? 'Due today · ' : 'Due '}
              {formatDateKey(todo.dueDate)}
            </p>
          )}
          {hasNotes && (
            <>
              <p
                className={`todo-card__notes${
                  isNotesExpanded ? ' todo-card__notes--expanded' : ''
                }`}
              >
                {todo.notes}
              </p>
              {isNotesLong && (
                <button
                  className="todo-card__notes-toggle"
                  type="button"
                  aria-expanded={isNotesExpanded}
                  onClick={() => setIsNotesExpanded((expanded) => !expanded)}
                >
                  {isNotesExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </>
          )}
        </div>

        <div className="todo-card__actions">
          <button
            className="todo-card__action"
            type="button"
            aria-label={`Edit ${todo.title}`}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="todo-card__action todo-card__action--danger"
            type="button"
            aria-label={`Delete ${todo.title}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </article>
    </li>
  )
}
