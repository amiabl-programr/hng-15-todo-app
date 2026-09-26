/** Formats a `Date` as a local `YYYY-MM-DD` key (never UTC, so it matches the user's day boundaries). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

/** Parses a `YYYY-MM-DD` key into a local `Date`, or returns null when the input is not a valid calendar date. */
export function parseDateKey(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split('-')
  if (year === undefined || month === undefined || day === undefined) {
    return null
  }

  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(parsed.getTime()) || toDateKey(parsed) !== dateKey) {
    return null
  }
  return parsed
}

const displayFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return date === null ? dateKey : displayFormatter.format(date)
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey()
}

export function isPastDue(dateKey: string): boolean {
  return dateKey < todayKey()
}
