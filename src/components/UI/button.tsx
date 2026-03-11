import React from 'react';

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'primary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
};

export function Button({ variant = 'default', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
