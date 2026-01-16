'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="
          relative z-10
          w-full sm:max-w-md
          max-h-[85vh]
          bg-white
          rounded-t-3xl sm:rounded-2xl
          shadow-xl
          animate-fade-in
          overflow-hidden
        "
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-lg">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors tap-target focus:outline-none focus:ring-2 focus:ring-[var(--dewpoint)] focus:ring-offset-2"
            >
              <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto max-h-[60vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
