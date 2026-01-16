'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title = 'PatchPal', showBack = false, rightElement }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-50 safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors tap-target"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center */}
        <h1 className="font-display font-bold text-xl text-[var(--foreground)]">
          {title}
        </h1>

        {/* Right */}
        <div className="w-10 flex justify-end">
          {rightElement}
        </div>
      </div>
    </header>
  );
}
