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
  setupFiles: ['jest-canvas-mock'],
};
