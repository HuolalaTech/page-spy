/**
 * @type {import("ts-jest/dist/types").InitialOptionsTsJest}
 */
module.exports = {
  projects: [
    {
      displayName: {
        name: 'Web',
        color: '#3080EE',
      },
      testMatch: ['<rootDir>/tests/web/**/*.test.ts'],
      testEnvironment: 'jsdom',
      collectCoverage: true,
      coverageDirectory: './coverage/web',
      coverageProvider: 'v8',
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
      testMatch: ['<rootDir>/tests/miniprogram/**.test.ts'],
      testEnvironment: 'jsdom',
      collectCoverage: true,
      coverageDirectory: './coverage/miniprogram',
      coverageProvider: 'v8',
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
      collectCoverage: true,
      coverageDirectory: './coverage/utils',
      coverageProvider: 'v8',
      preset: 'ts-jest',
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};
