/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  collectCoverage: true,
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/__mocks__/assets.js',
    modernizr: '<rootDir>/tests/__mocks__/modernizr.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', 'jest-canvas-mock'],
};
