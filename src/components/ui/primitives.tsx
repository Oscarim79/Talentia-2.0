import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type BadgeVariant = 'slate' | 'green' | 'amber' | 'red' | 'brand' | 'blue';
const badgeStyles: Record<BadgeVariant, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  brand: 'bg-indigo-100 text-indigo-700',
  blue: 'bg-blue-100 text-blue-700',
};

export function Badge({
  variant = 'slate',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  variant = 'primary',
  className,
  children,
  onClick,
  disabled,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-green-600">{delta}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">{icon}</div>
        )}
      </div>
    </Card>
  );
}

export function scoreVariant(score: number): BadgeVariant {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 80 ? 'bg-green-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full', color)} style={{ width: `${v}%` }} />
    </div>
  );
}
