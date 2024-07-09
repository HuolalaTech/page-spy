import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { dirname } from 'path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const getBabel = (mode) => {
  return babel({
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
        mode === 'iife'
          ? {
              useBuiltIns: 'usage',
              corejs: '3.30',
            }
          : {
              useBuiltIns: false,
            },
      ],
      '@babel/preset-typescript',
    ],
  });
};

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
  terser(),
];

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'iife',
      name: 'RRWebPlugin',
      sourcemap: true,
    },
    plugins: [
      ...plugins,
      getBabel('iife'),
      del({ targets: [dirname(pkg.main)] }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      ...plugins,
      getBabel('esm'),
      del({ targets: [dirname(pkg.module)] }),
    ],
  },
];
