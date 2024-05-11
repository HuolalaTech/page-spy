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
    '!packages/page-spy-harmony',
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
    {
      displayName: {
        name: 'RN',
        color: 'blue',
      },
      preset: 'react-native',
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': [
          'babel-jest',
          { configFile: './packages/page-spy-react-native/babel.config.js' },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base)',
      ],
      testMatch: ['**/packages/page-spy-react-native/tests/**/*.test.ts'],
      moduleNameMapper,
      setupFilesAfterEnv: [
        '<rootDir>/packages/page-spy-react-native/tests/setup.ts',
      ],
    },
  ],
};

export default config;
