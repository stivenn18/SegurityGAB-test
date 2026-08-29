const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  moduleNameMapper: {
    // CSS modules
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // plain styles
    '^.+\\.(css|sass|scss)$': '<rootDir>/test/styleMock.js',
    // static assets
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$': '<rootDir>/test/fileMock.js',
    // tsconfig path alias
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
