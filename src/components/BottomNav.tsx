'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/settings', icon: Settings, label: 'Settings' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav-floating">
      <div className="flex items-center justify-center gap-2 h-16 px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center justify-center
                rounded-full transition-all duration-300 ease-out
                tap-target
                ${isActive
                  ? 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)] px-4 py-2.5 gap-2'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] p-2.5'
                }
              `}
            >
              <Icon
                className={`w-[22px] h-[22px] transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              {isActive && (
                <span className="text-sm font-semibold whitespace-nowrap animate-nav-label">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
