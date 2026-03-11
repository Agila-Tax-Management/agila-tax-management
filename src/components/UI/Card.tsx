import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
