'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const variants = {
    default: 'bg-[var(--dewpoint-light)] text-[var(--foreground)]',
    success: 'bg-[var(--sweet-mint-light)] text-[var(--sweet-mint-dark)]',
    warning: 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)]',
    info: 'bg-[var(--dewpoint)] text-[var(--foreground)]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
