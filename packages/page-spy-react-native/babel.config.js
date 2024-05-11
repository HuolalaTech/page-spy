const { DEFAULT_EXTENSIONS } = require('@babel/core');

module.exports = {
  exclude: ['node_modules/**'],
  // extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
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
};
