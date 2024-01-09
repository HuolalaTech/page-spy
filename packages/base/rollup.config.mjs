import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import alias from '@rollup/plugin-alias';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  json(),
  nodeResolve(),
  commonjs(),
  typescript({
    // exclude: 'tests/**/*',
  }),
  replace({
    PKG_VERSION: `"${pkg.version}"`,
    preventAssignment: true,
  }),
  alias({
    entries: [{ find: 'src', replacement: resolve(root, './src') }],
  }),
  uglify(),
];

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'esm',
    },
  ],
  plugins: [
    ...plugins,
    babel({
      exclude: ['node_modules/**'],
      babelHelpers: 'runtime',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
    }),
    del({ targets: ['dist/*'] }),
  ],
};
