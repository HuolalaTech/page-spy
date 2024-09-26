import { defineConfig } from 'vite';
import { babel } from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  if (isBuild) {
    return {
      build: {
        minify: true,
        sourcemap: true,
        cssCodeSplit: true,
        lib: {
          entry: './src/index.ts',
          name: '$wholeBundle',
          formats: ['iife'],
          fileName(format, entryName) {
            console.log({ format, entryName });
            return 'index.min.js';
          },
        },
      },
      plugins: [
        babel({
          /**
           * Why exclude core-js?
           * See: https://github.com/rollup/rollup-plugin-babel/issues/254
           */
          exclude: ['node_modules/**', /\/core-js\//],
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
      ],
    };
  }
  return {
    server: {
      port: 9000,
    },
  };
});
