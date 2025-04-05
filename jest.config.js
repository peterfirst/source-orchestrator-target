/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testTimeout: 600000,
  transform: {
    '^.+\\.ts$': ['ts-jest'],
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
};
