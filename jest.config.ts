import type { Config } from 'jest';

const config: Config = {
  collectCoverageFrom: ['packages/**/*.ts', '!packages/**/*.d.ts'],
  coverageProvider: 'v8',
  displayName: {
    name: 'Base',
    color: 'gray',
  },
  testMatch: ['<rootDir>/packages/base/tests/**/*.test.ts'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/packages/base/src/$1',
  },
  // projects: [
  //   {
  //   },
  //   {
  //     displayName: {
  //       name: 'Web',
  //       color: 'yellow',
  //     },
  //     testMatch: ['<rootDir>/packages/web/tests/**/*.test.ts'],
  //     testEnvironment: 'jsdom',
  //     preset: 'ts-jest',
  //     setupFilesAfterEnv: [
  //       '<rootDir>/packages/web/tests/setup.ts',
  //       'jest-canvas-mock',
  //     ],
  //     moduleNameMapper: {
  //       '^src/(.*)$': '<rootDir>/packages/web/src/$1',
  //       '^base/(.*)$': '<rootDir>/packages/base/$1',
  //       '\\.(css|less|svg|png|jpg)$':
  //         '<rootDir>/packages/web/tests/__mocks__/assets.js',
  //     },
  //   },
  //   {
  //     displayName: {
  //       name: 'Mini Program',
  //       color: 'green',
  //     },
  //     testMatch: ['<rootDir>/packages/miniprogram/tests/**/*.test.ts'],
  //     preset: 'ts-jest',
  //     setupFilesAfterEnv: ['<rootDir>/packages/miniprogram/tests/setup.ts'],
  //     moduleNameMapper: {
  //       '^src/(.*)$': '<rootDir>/packages/miniprogram/src/$1',
  //       '^base/(.*)$': '<rootDir>/packages/base/$1',
  //     },
  //   },
  // ],
};

export default config;
