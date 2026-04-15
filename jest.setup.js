// Add custom jest matchers from jest-dom
require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js Image component
const React = require('react');

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return React.createElement('img', props);
  },
}));

// Suppress console errors in tests (optional - remove if you want to see all logs)
global.console = {
  ...console,
  error: jest.fn(), // Mock console.error to reduce noise
  warn: jest.fn(),  // Mock console.warn to reduce noise
};
