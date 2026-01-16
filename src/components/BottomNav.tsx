'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PenSquare, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/log', icon: PenSquare, label: 'Log' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/settings', icon: Settings, label: 'Settings' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        bg-white/90 backdrop-blur-lg
        border-t border-gray-100
        safe-area-inset-bottom
      "
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                w-16 h-14 rounded-xl
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
