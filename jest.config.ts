import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsConfig from './tsconfig.json';

const moduleNameMapper = {
  ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  '\\.(css|less|svg|png|jpg)$':
    '<rootDir>/packages/page-spy-browser/tests/__mocks__/assets.js',
};

/**
 * The following fields cannot be global config and
 * must define in the item of 'projects':
 * - moduleNameMapper
 * - testMatch
 * - preset
 */

const config: Config = {
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!**/*.test.ts',
    '!packages/**/eval.js',
  ],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: {
        name: 'Base',
        color: 'cyanBright',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/base/tests/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      displayName: {
        name: 'Browser',
        color: 'yellow',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/page-spy-browser/tests/**/*.test.ts'],
      moduleNameMapper,
      setupFilesAfterEnv: [
        '<rootDir>/packages/page-spy-browser/tests/setup.ts',
        'jest-canvas-mock',
      ],
    },
    {
      displayName: {
        name: 'MPBase',
        color: 'green',
      },
      preset: 'ts-jest',
      testMatch: ['**/packages/mp-base/tests/**/*.test.ts'],
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/packages/mp-base/tests/setup.ts'],
    },
  ],
};

export default config;
