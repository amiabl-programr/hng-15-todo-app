const { webcrypto } = require('node:crypto')

// jsdom does not always expose crypto.randomUUID, which todo ids depend on.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  })
}
