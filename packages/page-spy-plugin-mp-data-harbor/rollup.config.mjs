import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { dirname } from 'path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  nodeResolve(),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
  }),
  replace({
    PKG_VERSION: `"${pkg.version}"`,
    preventAssignment: true,
  }),
];

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
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
      del({ targets: [dirname(pkg.main)] }),
    ],
    external: [
      '@huolala-tech/page-spy-mp-base'
    ],

  },
];
