module.exports = {
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};
