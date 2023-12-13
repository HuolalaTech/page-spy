import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { uglify } from 'rollup-plugin-uglify';
import alias from '@rollup/plugin-alias';
import image from '@rollup/plugin-image';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  image(),
  json(),
  nodeResolve(),
  commonjs(),
  typescript({
    // exclude: 'tests/**/*',
  }),
  postcss({
    extensions: ['.css', '.less'],
    extract: false,
    plugins: [autoprefixer()],
  }),
  alias({
    entries: [
      { find: 'src', replacement: resolve(root, './src') },
      {
        find: 'web',
        replacement: resolve(root, './src/packages/web'),
      },
      {
        find: 'miniprogram',
        replacement: resolve(root, './src/packages/miniprogram'),
      },
    ],
  }),
  babel({
    exclude: ['node_modules/**', /deps\/modernizr/],
    babelHelpers: 'bundled',
    extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
  }),
  uglify(),
];

/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  {
    input: 'src/packages/web/index.ts',
    output: [
      {
        file: pkg.exports['.'],
        format: 'iife',
        name: 'PageSpy',
      },
      {
        file: pkg.exports['./web'],
        format: 'esm',
      },
    ],
    plugins: [...plugins, del({ targets: ['dist/web/*'] })],
  },
  {
    input: 'src/packages/miniprogram/index.ts',
    output: [
      {
        file: pkg.exports['./mp'],
        format: 'esm',
      },
    ],
    plugins: [...plugins, del({ targets: ['dist/mp/*'] })],
  },
];
