/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  collectCoverageFrom: ['packages/**/*.{ts,tsx}', '!packages/**/*.d.ts'],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: {
        name: 'Base',
        color: '#FBBF0D',
      },
      testMatch: ['<rootDir>/packages/base/tests/**/*.test.ts'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/packages/base/src/$1',
      },
    },
    {
      displayName: {
        name: 'Web',
        color: '#3080EE',
      },
      testMatch: ['<rootDir>/packages/web/tests/**/*.test.ts'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      setupFilesAfterEnv: [
        '<rootDir>/packages/web/tests/setup.ts',
        'jest-canvas-mock',
      ],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/packages/web/src/$1',
        '\\.(css|less|svg|png|jpg)$':
          '<rootDir>/packages/web/tests/__mocks__/assets.js',
      },
    },
    {
      displayName: {
        name: 'Mini Program',
        color: '#84DC42',
      },
      testMatch: ['<rootDir>/packages/miniprogram/tests/**/*.test.ts'],
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/packages/miniprogram/tests/setup.ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/packages/miniprogram/src/$1',
      },
    },
  ],
};
