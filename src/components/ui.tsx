import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store';

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal-700 text-white active:bg-teal-800',
  secondary: 'bg-slate-100 text-slate-800 active:bg-slate-200',
  outline: 'bg-white text-slate-700 border-2 border-slate-200 active:bg-slate-50',
  success: 'bg-green-600 text-white active:bg-green-700',
  danger: 'bg-red-600 text-white active:bg-red-700',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-2xl px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  const { t } = useStore();
  return (
    <header className="sticky top-0 z-20 bg-teal-700 text-white px-4 py-4 flex items-center gap-3 shadow-sm">
      {onBack && (
        <button
          onClick={onBack}
          aria-label={t('back')}
          className="p-2 -ml-2 rounded-full active:bg-teal-800"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${onClick ? 'cursor-pointer active:bg-slate-50' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeColor = 'pending' | 'accepted' | 'rejected' | 'neutral' | 'verified';

const badgeClasses: Record<BadgeColor, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
  verified: 'bg-blue-100 text-blue-700',
};

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badgeClasses[color]}`}>
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-base font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border-2 border-slate-200 px-4 py-3.5 text-lg text-slate-800 outline-none focus:border-teal-500 ${props.className || ''}`}
    />
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-slate-300 mb-4">{icon}</div>
      <p className="text-lg font-semibold text-slate-500">{title}</p>
      {message && <p className="text-base text-slate-400 mt-2">{message}</p>}
    </div>
  );
}
