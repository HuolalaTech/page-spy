import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  nodeResolve(),
  typescript({
    tsconfigOverride: { include: ['packages/page-spy-plugin-data-harbor/src'] },
  }),
  replace({
    PKG_VERSION: `"${pkg.version}"`,
    preventAssignment: true,
  }),
  alias({
    entries: [{ find: 'base', replacement: resolve(root, '../base') }],
  }),
  terser(),
  babel({
    /**
     * Why exclude core-js?
     * See: https://github.com/rollup/rollup-plugin-babel/issues/254
     */
    exclude: ['node_modules/**', /\/core-js\//],
    babelHelpers: 'bundled',
    extensions: [...DEFAULT_EXTENSIONS, '.ts'],
    presets: [
      [
        '@babel/env',
        {
          useBuiltIns: 'usage',
          corejs: '3.30',
        },
      ],
      '@babel/preset-typescript',
    ],
  }),
  del({ targets: ['dist/*'] }),
];

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.min.js',
      format: 'iife',
      name: 'DataHarborPlugin',
    },
    {
      file: 'dist/esm.min.js',
      format: 'esm',
    },
  ],
  plugins: [...plugins],
};
