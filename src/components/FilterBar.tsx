import { FILTER_LABELS, FILTERS } from '../types'
import type { Filter } from '../types'
import type { TodoCounts } from '../hooks/useTodos'
import './FilterBar.css'

export interface FilterBarProps {
  filter: Filter
  counts: TodoCounts
  completedCount: number
  onFilterChange: (filter: Filter) => void
  onClearCompleted: () => void
}

export function FilterBar({
  filter,
  counts,
  completedCount,
  onFilterChange,
  onClearCompleted,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__group" role="group" aria-label="Filter tasks">
        {FILTERS.map((value) => (
          <button
            key={value}
            className="filter-bar__tab"
            type="button"
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {FILTER_LABELS[value]}
            <span className="filter-bar__count">{counts[value]}</span>
          </button>
        ))}
      </div>

      {completedCount > 0 && (
        <button
          className="filter-bar__clear"
          type="button"
          onClick={onClearCompleted}
        >
          Clear completed
        </button>
      )}
    </div>
  )
}
