const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(jose|@supabase|@heroicons|@radix-ui|nanoid|next)/)'],
  globals: {
    NEXT_PUBLIC_SUPABASE_URL: 'test-url',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    STRIPE_SECRET_KEY: 'test-key',
    STRIPE_WEBHOOK_SECRET: 'test-webhook-secret',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'test-publishable-key',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
