module.exports = {
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
};
