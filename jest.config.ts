const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@supabase|@supabase/supabase-js|@supabase/realtime-js|isows|uuid)/)"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default config;