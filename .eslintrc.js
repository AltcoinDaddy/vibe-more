module.exports = {
  extends: ['next/core-web-vitals'],
  plugins: ['local'],
  rules: {
    // Enable our custom rule to prevent legacy Cadence syntax
    'local/no-legacy-cadence': 'error',
  },
  settings: {
    'local-rules': {
      'no-legacy-cadence': require('./eslint-rules/no-legacy-cadence'),
    },
  },
};