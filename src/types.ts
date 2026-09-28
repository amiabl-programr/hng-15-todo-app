export type TodoId = string

export interface Todo {
  id: TodoId
  title: string
  /** Free-form multi-line notes. Empty string means no notes. */
  notes: string
  completed: boolean
  /** ISO calendar date (`YYYY-MM-DD`) in the user's local timezone, or null when unset. */
  dueDate: string | null
  createdAt: number
}

export const FILTERS = ['all', 'active', 'completed'] as const

export type Filter = (typeof FILTERS)[number]

export const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

export type TodoDraft = Pick<Todo, 'title' | 'notes' | 'dueDate'>

export type TodoEdits = Partial<Omit<Todo, 'id' | 'createdAt'>>
