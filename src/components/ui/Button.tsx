'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-200 ease-out
    tap-target
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-[var(--fairy-tale-dream)] text-[var(--foreground)]
      hover:bg-[var(--fairy-tale-dream-dark)]
      focus:ring-[var(--fairy-tale-dream)]
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-[var(--sweet-mint)] text-[var(--foreground)]
      hover:bg-[var(--sweet-mint-dark)]
      focus:ring-[var(--sweet-mint)]
      shadow-sm hover:shadow-md
    `,
    outline: `
      border-2 border-[var(--dewpoint)]
      text-[var(--foreground)]
      hover:bg-[var(--dewpoint-light)]
      focus:ring-[var(--dewpoint)]
    `,
    ghost: `
      text-[var(--foreground-secondary)]
      hover:bg-[var(--background-secondary)]
      focus:ring-[var(--dewpoint)]
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
