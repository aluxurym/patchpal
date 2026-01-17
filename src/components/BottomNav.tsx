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
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                w-14 h-12 rounded-xl
                transition-all duration-200
                tap-target
                ${isActive
                  ? 'text-[var(--fairy-tale-dream-dark)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
                }
              `}
            >
              <div
                className={`
                  p-1.5 rounded-lg transition-colors duration-200
                  ${isActive ? 'bg-[var(--fairy-tale-dream-light)]' : ''}
                `}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
