import typescript from 'rollup-plugin-typescript2';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import babel from '@rollup/plugin-babel';
import del from 'rollup-plugin-delete';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  nodeResolve(),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
  }),
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
  replace({
    PKG_VERSION: `"${pkg.version}"`,
    preventAssignment: true,
  }),
  postcss({
    extensions: ['.css', '.less'],
    extract: false,
    plugins: [autoprefixer()],
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
  plugins: [...plugins, del({ targets: ['dist/*'] })],
  external: [
    'react-native',
    'promise/setimmediate/rejection-tracking',
    'promise/setimmediate/es6-extensions',
  ],
};
