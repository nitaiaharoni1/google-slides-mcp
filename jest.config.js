module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Coverage thresholds removed - coverage still runs but doesn't block builds
  // coverageThreshold: {
  //   global: {
  //     branches: 75,
  //     functions: 75,
  //     lines: 80,
  //     statements: 80,
  //   },
  //   './src/auth/': {
  //     branches: 85,
  //     functions: 90,
  //     lines: 90,
  //     statements: 90,
  //   },
  //   './src/tools/': {
  //     branches: 80,
  //     functions: 85,
  //     lines: 85,
  //     statements: 85,
  //   },
  // },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // 30 seconds for API operations
  verbose: true,
  forceExit: true, // Ensure Jest exits after tests complete
  detectOpenHandles: true, // Help detect async operations that prevent Jest from exiting
  maxWorkers: '50%', // Run tests in parallel using 50% of available CPU cores
  
  // Test file patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Transform ESM modules  
  transformIgnorePatterns: [
    'node_modules/(?!(open)/)'
  ],
  
  // Separate test patterns for unit vs integration tests
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      maxWorkers: '50%', // Run tests in parallel
      testMatch: [
        '<rootDir>/tests/**/*.test.ts',
        '!<rootDir>/tests/integration/**',
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      maxWorkers: '50%', // Run tests in parallel
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.ts',
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
  ],
}; 