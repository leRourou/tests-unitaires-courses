export default {
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
    moduleFileExtensions: ['js'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    testPathIgnorePatterns: ['/node_modules/'],
    clearMocks: true,
  };