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
  projects: [
    {
      displayName: {
        name: 'Base',
        color: 'gray',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/base/tests/**/*.test.ts'],
      moduleNameMapper: {
        ...tsConfigPathsMap,
        '\\.(css|less|svg|png|jpg)$':
          '<rootDir>/packages/web/tests/__mocks__/assets.js',
      },
    },
    {
      displayName: {
        name: 'Web',
        color: 'yellow',
      },
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/web/tests/**/*.test.ts'],
      moduleNameMapper: {
        ...tsConfigPathsMap,
        '\\.(css|less|svg|png|jpg)$':
          '<rootDir>/packages/web/tests/__mocks__/assets.js',
      },
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
      moduleNameMapper: {
        ...tsConfigPathsMap,
        '\\.(css|less|svg|png|jpg)$':
          '<rootDir>/packages/web/tests/__mocks__/assets.js',
      },
      setupFilesAfterEnv: ['<rootDir>/packages/miniprogram/tests/setup.ts'],
    },
  ],
};

export default config;
