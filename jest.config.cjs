/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/test/styleMock.cjs',
  },
  setupFiles: ['<rootDir>/src/test/setup.cjs'],
  clearMocks: true,
  restoreMocks: true,
}
