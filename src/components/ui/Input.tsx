import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-300 bg-red-50 focus:ring-red-300' : 'border-stone-200 hover:border-rose-200',
            leftIcon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-400 transition-all duration-200 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-300 bg-red-50 focus:ring-red-300' : 'border-stone-200 hover:border-rose-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}
