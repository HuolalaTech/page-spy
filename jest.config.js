/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/mock/assets.js',
  },
  globals: {
    TextEncoder: require('util').TextEncoder,
    TextDecoder: require('util').TextDecoder,
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', 'jest-canvas-mock'],
};
