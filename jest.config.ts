import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Automatically import jest-dom matchers
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // If you want to target tests in a separate directory:
  testMatch: ['<rootDir>/tests/**/*.(spec|test).ts?(x)'],
};

export default config;
