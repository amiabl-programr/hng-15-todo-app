import {
  normalizeNotes,
  normalizeText,
  NOTES_MAX_LENGTH,
  NOTES_MAX_LINES,
  sanitizeNotes,
  sanitizeText,
  sanitizeTitle,
  TITLE_MAX_LENGTH,
} from './sanitize'

describe('normalizeText', () => {
  it('trims and collapses whitespace runs', () => {
    expect(normalizeText('  buy   milk  ')).toBe('buy milk')
    expect(normalizeText('a\t\nb')).toBe('a b')
  })

  it('collapses non-breaking and ideographic spaces', () => {
    expect(normalizeText('a\u00A0\u3000b')).toBe('a b')
  })

  it('removes zero-width and bidi control characters without splitting words', () => {
    expect(normalizeText('ad\u200Bmin\u200F')).toBe('admin')
    expect(normalizeText('a\uFEFFb')).toBe('ab')
    expect(normalizeText('\u202Aabc\u202E')).toBe('abc')
  })

  it('turns line separators into a space instead of dropping them', () => {
    expect(normalizeText('a\u2028b')).toBe('a b')
    expect(normalizeText('a\u2029b')).toBe('a b')
    expect(normalizeText('a\u0085b')).toBe('a b')
  })

  it('removes C0 and C1 control characters', () => {
    expect(normalizeText('a\u0000b\u0007c\u009Fd')).toBe('abcd')
  })

  it('applies NFC so equivalent strings normalise identically', () => {
    expect(normalizeText('cafe\u0301')).toBe('caf\u00E9')
  })

  it('leaves angle brackets and ampersands intact', () => {
    // Escaping happens at render time in React, not here — escaping here would
    // store the entities and display them literally.
    expect(normalizeText('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>')
    expect(normalizeText('Tom & Jerry')).toBe('Tom & Jerry')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeText('   \u200B  ')).toBe('')
  })
})

describe('sanitizeText', () => {
  it('returns normalised text when within the limit', () => {
    expect(sanitizeText('  hello  world ', 100)).toBe('hello world')
  })

  it('truncates to the limit', () => {
    expect(sanitizeText('abcdefgh', 4)).toBe('abcd')
  })

  it('does not split a surrogate pair when truncating', () => {
    // Each emoji is one code point but two UTF-16 units.
    expect(sanitizeText('🎉🎉🎉', 2)).toBe('🎉🎉')
  })

  it('trims again after truncating', () => {
    expect(sanitizeText('ab cd', 3)).toBe('ab')
  })
})

describe('sanitizeTitle', () => {
  it('caps titles at TITLE_MAX_LENGTH code points', () => {
    const title = sanitizeTitle('x'.repeat(TITLE_MAX_LENGTH + 50))
    expect([...title]).toHaveLength(TITLE_MAX_LENGTH)
  })

  it('leaves a short title untouched', () => {
    expect(sanitizeTitle('  Buy milk  ')).toBe('Buy milk')
  })
})

describe('normalizeNotes', () => {
  it('preserves line breaks', () => {
    expect(normalizeNotes('one\ntwo\nthree')).toBe('one\ntwo\nthree')
  })

  it('normalises CRLF and CR to LF', () => {
    expect(normalizeNotes('one\r\ntwo\rthree')).toBe('one\ntwo\nthree')
  })

  it('collapses horizontal whitespace inside a line but keeps the breaks', () => {
    expect(normalizeNotes('a  \t b\nc')).toBe('a b\nc')
  })

  it('trims spaces around line breaks', () => {
    expect(normalizeNotes('one   \n   two')).toBe('one\ntwo')
  })

  it('limits blank runs to a single empty line', () => {
    expect(normalizeNotes('one\n\n\n\n\ntwo')).toBe('one\n\ntwo')
  })

  it('strips invisible characters without joining the lines', () => {
    expect(normalizeNotes('one\u200B\ntwo\u0000')).toBe('one\ntwo')
  })

  it('trims the outer edges', () => {
    expect(normalizeNotes('\n\n  notes  \n\n')).toBe('notes')
  })
})

describe('sanitizeNotes', () => {
  it('leaves notes within both caps untouched', () => {
    expect(sanitizeNotes('line one\nline two')).toBe('line one\nline two')
  })

  it('returns an empty string for whitespace-only notes', () => {
    expect(sanitizeNotes('  \n \n  ')).toBe('')
  })

  it('caps total length by code point', () => {
    expect([...sanitizeNotes('x'.repeat(NOTES_MAX_LENGTH + 100))]).toHaveLength(NOTES_MAX_LENGTH)
  })

  it('caps the number of lines', () => {
    const many = Array.from({ length: NOTES_MAX_LINES + 10 }, (_, i) => `l${i}`).join('\n')
    expect(sanitizeNotes(many).split('\n')).toHaveLength(NOTES_MAX_LINES)
  })

  it('does not split an emoji when capping length', () => {
    const emojis = '🎉'.repeat(NOTES_MAX_LENGTH + 10)
    const capped = sanitizeNotes(emojis)
    expect(capped).not.toContain('\uFFFD')
    expect([...capped]).toHaveLength(NOTES_MAX_LENGTH)
  })
})
