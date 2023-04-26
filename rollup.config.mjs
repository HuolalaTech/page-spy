import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { uglify } from 'rollup-plugin-uglify';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import image from '@rollup/plugin-image';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  image(),
  json(),
  nodeResolve(),
  commonjs(),
  typescript(),
  postcss({
    extensions: ['.css', '.less'],
    extract: false,
    plugins: [autoprefixer()],
  }),
  babel({
    exclude: ['node_modules/**', /deps\/modernizr/],
    babelHelpers: 'bundled',
    extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
  }),
  uglify(),
  del({ targets: ['dist/*'] }),
];

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'iife',
      name: 'PageSpy',
    },
  ],
  plugins,
};
