import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';
import tsconfigBase from './tsconfig.json';
import tsconfigPath from './tsconfig.paths.json';

// tell ts-jest about the path mapping info
const tsCompilerOptions = {
  ...tsconfigBase.compilerOptions,
  ...tsconfigPath.compilerOptions,
};

// use ts-jest to transpile .js, .jsx, .ts, .tsx
const transform: any = {
  '^.+\\.[tj]sx?$': [
    'ts-jest',
    {
      tsconfig: tsCompilerOptions,
    },
  ],
};

const moduleNameMapper = {
  ...pathsToModuleNameMapper(tsconfigPath.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  '\\.(css|less)$': '<rootDir>/node_modules/jest-css-modules',
  '\\.(svg|png|jpg)$':
    '<rootDir>/packages/page-spy-browser/tests/__mocks__/assets.js',
};

/**
 * The following fields cannot be global config and
 * must define in the item of 'projects':
 * - moduleNameMapper
 * - testMatch
 * - preset
 * - transform
 */

const config: JestConfigWithTsJest = {
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!**/*.test.ts',
    '!packages/**/eval.js',
    '!packages/page-spy-harmony',
    '!packages/page-spy-react-native',
  ],
  coverageProvider: 'v8',
  projects: [
    {
      displayName: {
        name: 'Base',
        color: 'cyanBright',
      },
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/page-spy-base/tests/**/*.test.ts'],
      moduleNameMapper,
      transform,
    },
    {
      displayName: {
        name: 'Browser',
        color: 'yellow',
      },
      testEnvironment: 'jsdom',
      testMatch: ['**/packages/page-spy-browser/tests/**/*.test.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/packages/page-spy-browser/tests/setup.ts',
        'jest-canvas-mock',
      ],
      moduleNameMapper,
      transform,
    },
    {
      displayName: {
        name: 'MPBase',
        color: 'green',
      },
      testMatch: ['**/packages/page-spy-mp-base/tests/**/*.test.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/packages/page-spy-mp-base/tests/setup.ts',
      ],
      moduleNameMapper,
      transform,
    },
  ],
};

export default config;
