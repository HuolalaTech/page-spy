/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: {
        name: 'Web',
        color: '#3080EE',
      },
      testMatch: ['<rootDir>/tests/web/**/*.test.ts'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/web/setup.ts', 'jest-canvas-mock'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^web/(.*)$': '<rootDir>/src/packages/web/$1',
        '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/__mocks__/assets.js',
      },
    },
    {
      displayName: {
        name: 'Mini Program',
        color: '#84DC42',
      },
      testMatch: ['<rootDir>/tests/miniprogram/**/*.test.ts'],
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/miniprogram/setup.ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^miniprogram/(.*)$': '<rootDir>/src/packages/miniprogram/$1',
        '\\.(css|less|svg|png|jpg)$': '<rootDir>/tests/__mocks__/assets.js',
      },
    },
    {
      displayName: {
        name: 'Utils',
        color: '#FBBF0D',
      },
      testMatch: ['<rootDir>/tests/utils/**/*.test.ts'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};
