import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import image from '@rollup/plugin-image';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  image(),
  json(),
  nodeResolve(),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
  }),
  postcss({
    modules: {
      autoModules: true,
      generateScopedName: '[local]-[hash:base64:5]',
    },
    extensions: ['.css', '.less'],
    extract: false,
    inject: (css) => {
      const code = `(function() {
        const style = document.createElement('style');
        style.setAttribute('data-page-spy-style', 'true');
        style.textContent = ${css};

        if (!window.pageSpyStyles || !Array.isArray(window.pageSpyStyles)) {
          window.pageSpyStyles = [];
        }

        window.pageSpyStyles.push(style);
      })();
      `;
      return code;
    },
    plugins: [postcssPresetEnv()],
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
      format: 'iife',
      name: 'PageSpy',
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
      /**
       * Why exclude core-js?
       * See: https://github.com/rollup/rollup-plugin-babel/issues/254
       */
      exclude: ['node_modules/**', /\/core-js\//, /deps\/modernizr/],
      babelHelpers: 'bundled',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
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
  ],
};
