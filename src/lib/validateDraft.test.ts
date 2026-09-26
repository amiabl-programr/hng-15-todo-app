import { validateDraft } from './validateDraft'
import { TITLE_MAX_LENGTH } from './sanitize'

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 2, 15, 9, 30)) // 15 Mar 2026
})

afterEach(() => {
  jest.useRealTimers()
})

function draft(title: string, dueDate: string | null = null) {
  return { title, dueDate }
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
