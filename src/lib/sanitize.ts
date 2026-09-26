/**
 * Text input hardening.
 *
 * Note on escaping: this module deliberately does NOT html-escape values.
 * React escapes every text node and attribute value on render, so escaping here
 * as well would double-encode stored data (a title of `<b>` would be saved as
 * `&lt;b&gt;` and then displayed literally as `&lt;b&gt;`). The real XSS vector
 * is `dangerouslySetInnerHTML` / `innerHTML` / `eval`, which is banned by lint
 * (see eslint.config.js). What this module does do is strip the characters that
 * let text be spoofed or break out of a rendered string, and cap the length.
 */

/**
 * Zero-width and bidi formatting marks, plus C0/C1 controls other than tab,
 * newline and carriage return. These contribute nothing visible, so they are
 * removed outright — turning them into spaces would split words apart.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the entire purpose here
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g

/** Separators that genuinely break the line, so they become a space rather than vanishing. */
const LINE_SEPARATOR = /[\u0085\u2028\u2029]/g

/** Whitespace runs, including non-breaking and ideographic spaces. */
const WHITESPACE_RUN = /[\s\u00A0\u3000]+/g

export const TITLE_MAX_LENGTH = 120

/**
 * Canonicalises text without capping it: NFC form, invisible characters
 * removed, whitespace collapsed and trimmed. Use this to measure input against
 * a limit; use `sanitizeText` to produce the value that gets stored.
 */
export function normalizeText(input: string): string {
  return input
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(LINE_SEPARATOR, ' ')
    .replace(WHITESPACE_RUN, ' ')
    .trim()
}

export function sanitizeText(input: string, maxLength: number): string {
  const normalized = normalizeText(input)

  // Spread by code point so truncation never splits a surrogate pair.
  const codePoints = [...normalized]
  if (codePoints.length <= maxLength) {
    return normalized
  }
  return codePoints.slice(0, maxLength).join('').trim()
}

export function sanitizeTitle(input: string): string {
  return sanitizeText(input, TITLE_MAX_LENGTH)
}
