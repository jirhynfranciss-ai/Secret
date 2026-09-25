import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'rose' | 'green' | 'amber' | 'stone' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'rose', className }: BadgeProps) {
  const variants = {
    rose: 'bg-rose-100 text-rose-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    stone: 'bg-stone-100 text-stone-600',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
