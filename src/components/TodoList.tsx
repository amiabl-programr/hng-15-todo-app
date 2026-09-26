import { useEffect, useRef, useState } from 'react'
import { TodoCard } from './TodoCard'
import type { Todo, TodoId } from '../types'
import './TodoList.css'

export interface TodoListProps {
  todos: Todo[]
  emptyMessage: string
  onToggle: (id: TodoId) => void
  onEdit: (id: TodoId) => void
  onDelete: (id: TodoId) => void
  onReorder: (draggedId: TodoId, targetId: TodoId) => void
  onMoveBy: (id: TodoId, offset: -1 | 1) => void
}

const EXIT_ANIMATION_MS = 160

export function TodoList({
  todos,
  emptyMessage,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onMoveBy,
}: TodoListProps) {
  const [draggingId, setDraggingId] = useState<TodoId | null>(null)
  const [dropTargetId, setDropTargetId] = useState<TodoId | null>(null)
  const [removingIds, setRemovingIds] = useState<ReadonlySet<TodoId>>(() => new Set())
  const removalTimers = useRef(new Map<TodoId, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timers = removalTimers.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  function handleDelete(id: TodoId) {
    if (removingIds.has(id)) {
      return
    }

    setRemovingIds((current) => new Set(current).add(id))
    removalTimers.current.set(
      id,
      setTimeout(() => {
        removalTimers.current.delete(id)
        setRemovingIds((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
        onDelete(id)
      }, EXIT_ANIMATION_MS),
    )
  }

  function handleDrop() {
    if (draggingId !== null && dropTargetId !== null) {
      onReorder(draggingId, dropTargetId)
    }
    setDraggingId(null)
    setDropTargetId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDropTargetId(null)
  }

  if (todos.length === 0) {
    return <p className="todo-list__empty">{emptyMessage}</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo, index) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          position={index}
          total={todos.length}
          isDragging={draggingId === todo.id}
          isDropTarget={dropTargetId === todo.id && draggingId !== todo.id}
          isRemoving={removingIds.has(todo.id)}
          onToggle={() => onToggle(todo.id)}
          onEdit={() => onEdit(todo.id)}
          onDelete={() => handleDelete(todo.id)}
          onDragStart={() => setDraggingId(todo.id)}
          onDragEnter={() => setDropTargetId(todo.id)}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onMoveBy={(offset) => onMoveBy(todo.id, offset)}
        />
      ))}
    </ul>
  )
}
