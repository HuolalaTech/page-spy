const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
  extract: false,
  plugins: [postcssPresetEnv()],
};
