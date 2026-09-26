import { isPastDue, parseDateKey, todayKey } from './dueDate'
import { normalizeText, TITLE_MAX_LENGTH } from './sanitize'
import type { TodoDraft } from '../types'

/**
 * Validates a draft before it is saved. A due date in the past is rejected at
 * input time only — once written, a due date is allowed to fall into the past as
 * the calendar advances, which is what makes a todo overdue rather than invalid.
 */
export function validateDraft(draft: TodoDraft): string | null {
  if (normalizeText(draft.title).length === 0) {
    return 'Give the task a title before saving.'
  }

  if ([...normalizeText(draft.title)].length > TITLE_MAX_LENGTH) {
    return `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`
  }

  if (draft.dueDate === null) {
    return null
  }

  if (parseDateKey(draft.dueDate) === null) {
    return 'Enter a valid due date.'
  }

  if (isPastDue(draft.dueDate)) {
    return `Due date cannot be in the past. Today is ${todayKey()}.`
  }

  return null
}
