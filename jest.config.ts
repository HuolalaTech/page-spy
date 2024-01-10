import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsConfig from './tsconfig.json';

const tsConfigPathsMap = pathsToModuleNameMapper(
  tsConfig.compilerOptions.paths,
  {
    prefix: '<rootDir>/',
  },
);

const config: Config = {
  collectCoverageFrom: ['packages/**/*.ts', '!packages/**/*.d.ts'],
  testMatch: ['**/packages/**/tests/**/*.test.ts'],
  preset: 'ts-jest',
  moduleNameMapper: {
    ...tsConfigPathsMap,
    '\\.(css|less|svg|png|jpg)$':
      '<rootDir>/packages/web/tests/__mocks__/assets.js',
  },
  projects: [
    {
      displayName: {
        name: 'Base',
        color: 'gray',
      },
      testEnvironment: 'jsdom',
    },
    {
      displayName: {
        name: 'Web',
        color: 'yellow',
      },
      testEnvironment: 'jsdom',
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
      setupFilesAfterEnv: ['<rootDir>/packages/miniprogram/tests/setup.ts'],
    },
  ],
};

export default config;
