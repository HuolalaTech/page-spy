import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsConfig from './tsconfig.json';

const moduleNameMapper = {
  ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  '\\.(css|less|svg|png|jpg)$':
    '<rootDir>/packages/web/tests/__mocks__/assets.js',
};

/**
 * The following fields cannot be global config and
 * must define in the item of 'projects':
 * - moduleNameMapper
 * - testMatch
 * - preset
 */

const config: Config = {
  collectCoverageFrom: ['packages/**/*.ts', '!packages/**/*.d.ts'],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: {
        name: 'Base',
        color: 'gray',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/base/tests/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      displayName: {
        name: 'Web',
        color: 'yellow',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/web/tests/**/*.test.ts'],
      moduleNameMapper,
      setupFilesAfterEnv: [
        '<rootDir>/packages/web/tests/setup.ts',
        'jest-canvas-mock',
      ],
    },
    {
      displayName: {
        name: 'Mini Program',
        color: 'green',
      },
      preset: 'ts-jest',
      testMatch: ['**/packages/miniprogram/tests/**/*.test.ts'],
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/packages/miniprogram/tests/setup.ts'],
    },
  ],
};

export default config;
