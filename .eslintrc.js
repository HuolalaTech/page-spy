module.exports = {
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'operator-linebreak': 'off',
    'object-curly-newline': 'off',
    'nonblock-statement-body-position': 'off',
    'import/prefer-default-export': 'off',
    indent: 'off',
    '@typescript-eslint/indent': 'off',
    'no-case-declarations': 'off',
    'func-names': 'off',
    'no-plusplus': 'off',
    'arrow-body-style': 'off',
    'max-classes-per-file': 'off',
    'prefer-template': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    'no-trailing-spaces': 'off',
    'arrow-parens': 'off',

    // set below rules to 'warn' to avoid confusion with real code errors。
    '@typescript-eslint/semi': 'warn',
    'padded-blocks': 'warn',
    'no-multiple-empty-lines': 'warn',
    '@typescript-eslint/quotes': 'warn',
    'max-len': 'warn',
  },
};
