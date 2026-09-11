import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store';

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'inverse';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal-700 text-white active:bg-teal-800',
  secondary: 'bg-slate-200 text-slate-900 active:bg-slate-300',
  outline: 'bg-white text-slate-800 border-2 border-slate-300 active:bg-slate-50',
  success: 'bg-green-700 text-white active:bg-green-800',
  danger: 'bg-red-700 text-white active:bg-red-800',
  inverse: 'bg-white text-teal-900 active:bg-teal-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

export function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  const { t } = useStore();
  return (
    <header className="sticky top-0 z-20 bg-teal-800 text-white px-4 py-4 flex items-center gap-3 shadow-sm shrink-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('back')}
          className="p-2 -ml-2 rounded-full text-white active:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      )}
      <h1 className="text-xl font-bold text-white truncate">{title}</h1>
    </header>
  );
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col h-full min-h-0 ${className}`}>{children}</div>;
}

export function ScreenBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 ${className}`}>{children}</div>;
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const classes = [
    'w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-slate-200',
    onClick
      ? 'cursor-pointer active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
        className={classes}
      >
        {children}
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
}

type BadgeColor = 'pending' | 'accepted' | 'rejected' | 'neutral' | 'verified' | 'progress';

const badgeClasses: Record<BadgeColor, string> = {
  pending: 'bg-amber-100 text-amber-900',
  accepted: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-900',
  neutral: 'bg-slate-200 text-slate-800',
  verified: 'bg-sky-100 text-sky-900',
  progress: 'bg-teal-100 text-teal-900',
};

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold shrink-0 ${badgeClasses[color]}`}>
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-base font-semibold text-slate-800">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3.5 text-lg text-slate-900',
        'placeholder:text-slate-500 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100',
        props.className || '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-slate-400 mb-4">{icon}</div>
      <p className="text-lg font-semibold text-slate-600">{title}</p>
      {message && <p className="text-base text-slate-500 mt-2">{message}</p>}
    </div>
  );
}
