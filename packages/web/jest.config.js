/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageProvider: 'v8',
  displayName: {
    name: 'Web',
    color: '#3080EE',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', 'jest-canvas-mock'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/__mocks__/assets.js',
  },
};
