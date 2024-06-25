import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
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
  replace({
    PKG_VERSION: `"${pkg.version}"`,
    preventAssignment: true,
  }),
  postcss({
    extensions: ['.css', '.less'],
    extract: false,
    plugins: [autoprefixer()],
  }),
  alias({
    entries: [
      { find: 'mp-base', replacement: resolve(root, '../mp-base') },
      { find: 'base', replacement: resolve(root, '../base') },
    ],
  }),
  terser(),
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
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    ...plugins,
    babel({
      exclude: ['node_modules/**'],
      babelHelpers: 'runtime',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
      plugins: ['@babel/plugin-transform-runtime'],
      presets: [
        [
          '@babel/env',
          {
            // useBuiltIns: false,
            corejs: '3.30',
          },
        ],
        '@babel/preset-typescript',
      ],
    }),
    del({ targets: ['dist/*'] }),
  ],
};
