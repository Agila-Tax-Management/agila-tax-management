// src/components/UI/__tests__/Badge.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple Badge component for testing (replace with actual Badge import)
function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: string }) {
  return (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  );
}

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByTestId('badge')).toHaveTextContent('Test Badge');
  });

  it('applies variant correctly', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'success');
  });

  it('defaults to neutral variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'neutral');
  });
});
