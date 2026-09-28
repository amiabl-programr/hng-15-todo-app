import { validateDraft } from './validateDraft'
import { NOTES_MAX_LENGTH, NOTES_MAX_LINES, TITLE_MAX_LENGTH } from './sanitize'

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 2, 15, 9, 30)) // 15 Mar 2026
})

afterEach(() => {
  jest.useRealTimers()
})

function draft(title: string, dueDate: string | null = null, notes = '') {
  return { title, notes, dueDate }
}

describe('validateDraft', () => {
  it('accepts a title with no due date', () => {
    expect(validateDraft(draft('Buy milk'))).toBeNull()
  })

  it('rejects an empty title', () => {
    expect(validateDraft(draft(''))).toBe('Give the task a title before saving.')
  })

  it('rejects a whitespace-only title', () => {
    expect(validateDraft(draft('   \t  '))).toBe('Give the task a title before saving.')
  })

  it('rejects a title made only of invisible characters', () => {
    expect(validateDraft(draft('\u200B\u200B'))).toBe('Give the task a title before saving.')
  })

  it('rejects a title longer than the cap', () => {
    expect(validateDraft(draft('x'.repeat(TITLE_MAX_LENGTH + 1)))).toBe(
      `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`,
    )
  })

  it('accepts a title exactly at the cap', () => {
    expect(validateDraft(draft('x'.repeat(TITLE_MAX_LENGTH)))).toBeNull()
  })

  it('measures the cap after invisible characters are removed', () => {
    const padded = `\u200B`.repeat(TITLE_MAX_LENGTH) + 'ok'
    expect(validateDraft(draft(padded))).toBeNull()
  })

  it('accepts today as a due date', () => {
    expect(validateDraft(draft('Pay rent', '2026-03-15'))).toBeNull()
  })

  it('accepts a future due date', () => {
    expect(validateDraft(draft('Pay rent', '2026-03-16'))).toBeNull()
  })

  it('rejects a due date in the past', () => {
    expect(validateDraft(draft('Pay rent', '2026-03-14'))).toBe(
      'Due date cannot be in the past. Today is 2026-03-15.',
    )
  })

  it('rejects a due date far in the past', () => {
    expect(validateDraft(draft('Old thing', '2000-01-01'))).toMatch(/cannot be in the past/)
  })

  it('rejects an unparseable due date', () => {
    expect(validateDraft(draft('Task', '2026-02-30'))).toBe('Enter a valid due date.')
    expect(validateDraft(draft('Task', 'garbage'))).toBe('Enter a valid due date.')
  })

  it('checks the title before the due date', () => {
    expect(validateDraft(draft('', '2000-01-01'))).toBe('Give the task a title before saving.')
  })
})

describe('validateDraft notes', () => {
  it('treats notes as optional', () => {
    expect(validateDraft(draft('Task', null, ''))).toBeNull()
  })

  it('accepts multi-line notes', () => {
    expect(validateDraft(draft('Task', null, 'first line\nsecond line\nthird line'))).toBeNull()
  })

  it('accepts notes at the length cap', () => {
    expect(validateDraft(draft('Task', null, 'x'.repeat(NOTES_MAX_LENGTH)))).toBeNull()
  })

  it('rejects notes past the length cap', () => {
    expect(validateDraft(draft('Task', null, 'x'.repeat(NOTES_MAX_LENGTH + 1)))).toBe(
      `Keep the notes to ${NOTES_MAX_LENGTH} characters or fewer.`,
    )
  })

  it('accepts notes at the line cap', () => {
    const notes = Array.from({ length: NOTES_MAX_LINES }, (_, i) => `line ${i}`).join('\n')
    expect(validateDraft(draft('Task', null, notes))).toBeNull()
  })

  it('rejects notes past the line cap', () => {
    const notes = Array.from({ length: NOTES_MAX_LINES + 1 }, (_, i) => `line ${i}`).join('\n')
    expect(validateDraft(draft('Task', null, notes))).toBe(
      `Keep the notes to ${NOTES_MAX_LINES} lines or fewer.`,
    )
  })

  it('measures the caps after whitespace is normalised', () => {
    const padded = `\n\n\n`.repeat(NOTES_MAX_LINES) + 'ok'
    expect(validateDraft(draft('Task', null, padded))).toBeNull()
  })

  it('rejects an over-long title even when notes are fine', () => {
    expect(validateDraft(draft('x'.repeat(TITLE_MAX_LENGTH + 1), null, 'fine'))).toBe(
      `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`,
    )
  })
})
