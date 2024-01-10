import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import baseTsConfig from './packages/base/tsconfig.json';
import webTsConfig from './packages/web/tsconfig.json';
import mpTsConfig from './packages/miniprogram/tsconfig.json';

const basePathsMap = pathsToModuleNameMapper(
  baseTsConfig.compilerOptions.paths,
  {
    prefix: '<rootDir>/packages/base/',
  },
);
const webPathsMap = pathsToModuleNameMapper(webTsConfig.compilerOptions.paths, {
  prefix: '<rootDir>/packages/web/',
});
const mpPathsMap = pathsToModuleNameMapper(mpTsConfig.compilerOptions.paths, {
  prefix: '<rootDir>/packages/miniprogram/',
});

const config: Config = {
  displayName: {
    name: 'Base',
    color: 'gray',
  },
  testMatch: ['<rootDir>/packages/base/tests/**/*.test.ts'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: basePathsMap,
};

export default config;
