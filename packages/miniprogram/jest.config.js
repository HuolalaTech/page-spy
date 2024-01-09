/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageProvider: 'v8',
  displayName: {
    name: 'Mini Program',
    color: '#84DC42',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^miniprogram/(.*)$': '<rootDir>/src/packages/miniprogram/$1',
    '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/__mocks__/assets.js',
  },
};
