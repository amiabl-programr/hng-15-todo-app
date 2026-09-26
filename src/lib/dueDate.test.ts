import { formatDateKey, isPastDue, isToday, parseDateKey, toDateKey, todayKey } from './dueDate'

const SYSTEM_TIME = new Date(2026, 2, 15, 9, 30) // 15 Mar 2026, local time

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(SYSTEM_TIME)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('toDateKey', () => {
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses the local calendar day, not UTC', () => {
    // 23:30 local on the 15th is still the 15th locally, even where UTC has rolled over.
    expect(toDateKey(new Date(2026, 2, 15, 23, 30))).toBe('2026-03-15')
  })
})

describe('todayKey', () => {
  it('reflects the system clock', () => {
    expect(todayKey()).toBe('2026-03-15')
  })
})

describe('parseDateKey', () => {
  it('parses a valid key into a local date', () => {
    const parsed = parseDateKey('2026-02-28')
    expect(parsed).not.toBeNull()
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(1)
    expect(parsed?.getDate()).toBe(28)
  })

  it('rejects keys that are not real calendar dates', () => {
    expect(parseDateKey('2026-02-30')).toBeNull()
    expect(parseDateKey('2026-13-01')).toBeNull()
    expect(parseDateKey('2026-00-10')).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(parseDateKey('')).toBeNull()
    expect(parseDateKey('nonsense')).toBeNull()
    expect(parseDateKey('2026-03')).toBeNull()
  })
})

describe('isToday', () => {
  it('is true only for the current day', () => {
    expect(isToday('2026-03-15')).toBe(true)
    expect(isToday('2026-03-14')).toBe(false)
    expect(isToday('2026-03-16')).toBe(false)
  })
})

describe('isPastDue', () => {
  it('is true for earlier days and false for today and later', () => {
    expect(isPastDue('2026-03-14')).toBe(true)
    expect(isPastDue('2000-01-01')).toBe(true)
    expect(isPastDue('2026-03-15')).toBe(false)
    expect(isPastDue('2026-03-16')).toBe(false)
  })
})

describe('formatDateKey', () => {
  it('includes the year', () => {
    expect(formatDateKey('2000-01-01')).toContain('2000')
  })

  it('falls back to the raw key when it cannot be parsed', () => {
    expect(formatDateKey('not-a-date')).toBe('not-a-date')
  })
})
