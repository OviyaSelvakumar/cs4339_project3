module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['airbnb'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import'],
  settings: {
    'import/extensions': ['.js', '.jsx'],
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.json']
      }
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-underscore-dangle': 'off',
    'camelcase': 'off',
    'import/no-relative-packages': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        ignorePackages: true,
        pattern: {
          js: 'never',
          jsx: 'never'
        }
      }
    ],
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'user',
          'Photo', 
          'photo',
          'photoObj',
          'acc',
          'req',
          'res',
          'body',
          'err'
        ]
      }
    ],
    
    'no-console': 'off',
    'prefer-destructuring': ['error', {
      VariableDeclarator: {
        array: false,
        object: true
      },
      AssignmentExpression: {
        array: false,
        object: true
      }
    }]
  }
};