module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '.',
  setupFiles: ['<rootDir>/jest.env.cjs'],
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.cjs',
    '^canvas-confetti$': '<rootDir>/tests/__mocks__/canvasConfetti.cjs',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-router|react-router-dom|@solar-icons|lucide-react)/)',
  ],
  coverageDirectory: '<rootDir>/../reports/frontend',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  // Limit coverage to the layers we actively test (data/service layer, auth context,
  // pure helpers, and reusable presentational components). Page-level glue is
  // exercised through manual UI testing rather than unit tests.
  collectCoverageFrom: [
    'src/services/**/*.{js,jsx}',
    'src/contexts/AuthContext.jsx',
    'src/pages/profile/profileUtils.jsx',
    'src/components/ProtectedRoute.jsx',
    'src/components/ChipListEditor.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/services/eventService 2.jsx',
  ],
};
