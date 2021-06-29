const path = require('path');

module.exports = {
  verbose: true,
  preset: 'react-native',
  transform: {
    '^.+\\.jsx?$': path.join(__dirname, './jest-transformer.js'),
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '__generated__', '__mocks__'],
  coverageDirectory: '<rootDir>/src/BarcodeScannerModule/__tests__/coverage',
  coverageReporters: ['lcov', 'text-summary'],
};
