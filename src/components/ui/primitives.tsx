import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, dataTour }: { className?: string; children: ReactNode; dataTour?: string }) {
  return (
    <div
      data-tour={dataTour}
      className={cn(
        'rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(33,49,43,0.05),0_4px_16px_-8px_rgba(33,49,43,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type BadgeVariant = 'stone' | 'green' | 'amber' | 'red' | 'brand' | 'blue' | 'gold';
const badgeStyles: Record<BadgeVariant, string> = {
  stone: 'bg-stone-100 text-stone-700',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  brand: 'bg-brand-50 text-brand-700',
  blue: 'bg-blue-100 text-blue-700',
  gold: 'bg-gold-100 text-gold-700',
};

export function Badge({
  variant = 'stone',
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
  dataTour,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dataTour?: string;
}) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/40 shadow-[0_1px_2px_rgba(5,42,32,0.3)]',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50',
    ghost: 'text-stone-600 hover:bg-stone-200/60',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-tour={dataTour}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
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
  deltaTone = 'up',
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'up' | 'warn' | 'risk' | 'muted';
  icon?: ReactNode;
}) {
  const deltaTones = {
    up: 'text-green-700',
    warn: 'text-amber-700',
    risk: 'text-red-600',
    muted: 'text-stone-500',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-stone-500">{label}</p>
          <p className="mt-2 font-display text-[32px] font-semibold leading-none tracking-tight text-ink">
            {value}
          </p>
          {delta && <p className={cn('mt-2 text-xs font-medium', deltaTones[deltaTone])}>{delta}</p>}
        </div>
        {icon && <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700">{icon}</div>}
      </div>
    </Card>
  );
}

export function scoreVariant(score: number): BadgeVariant {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

export function ProgressBar({
  value,
  className,
  tone = 'score',
}: {
  value: number;
  className?: string;
  tone?: 'score' | 'brand';
}) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    tone === 'brand'
      ? 'bg-brand-500'
      : v >= 80
        ? 'bg-green-500'
        : v >= 60
          ? 'bg-amber-500'
          : 'bg-red-500';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-stone-100', className)}>
      <div className={cn('h-full rounded-full', color)} style={{ width: `${v}%` }} />
    </div>
  );
}
