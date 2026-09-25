import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-md shadow-rose-200 focus-visible:ring-rose-400',
    secondary:
      'bg-pink-50 hover:bg-pink-100 active:bg-pink-200 text-rose-700 focus-visible:ring-rose-300',
    ghost:
      'bg-transparent hover:bg-rose-50 active:bg-rose-100 text-rose-600 focus-visible:ring-rose-300',
    danger:
      'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md shadow-red-200 focus-visible:ring-red-400',
    outline:
      'border border-rose-200 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 focus-visible:ring-rose-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}
