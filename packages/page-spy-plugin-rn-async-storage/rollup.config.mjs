import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';
import { resolve, dirname } from 'path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * @type {import('rollup').RollupOptions[]}
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
    nodeResolve(),
    commonjs(),
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
            useBuiltIns: false,
          },
        ],
        '@babel/preset-typescript',
      ],
    }),
    del({ targets: [dirname(pkg.module)] }),
  ],
  external: ['@react-native-async-storage/async-storage']
}
