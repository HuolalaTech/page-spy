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
        {
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
];

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      ...plugins,
      getBabel('esm'),
      del({ targets: [dirname(pkg.main)] }),
    ],
    external: [
      '@huolala-tech/page-spy-mp-base'
    ]
  },
];