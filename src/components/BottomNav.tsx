import { Home, Briefcase, ClipboardList, User, ClipboardCheck } from 'lucide-react';
import { useStore } from '@/store';
import type { Role } from '@/types';

interface NavItem {
  key: string;
  labelKey: string;
  icon: typeof Home;
}

const workerNav: NavItem[] = [
  { key: 'worker-home', labelKey: 'home', icon: Home },
  { key: 'worker-applications', labelKey: 'myApplications', icon: ClipboardList },
  { key: 'worker-my-job', labelKey: 'myJob', icon: Briefcase },
  { key: 'worker-profile', labelKey: 'profile', icon: User },
];

const employerNav: NavItem[] = [
  { key: 'employer-home', labelKey: 'home', icon: Home },
  { key: 'employer-applicants', labelKey: 'jobs', icon: Briefcase },
  { key: 'employer-attendance', labelKey: 'attendance', icon: ClipboardCheck },
  { key: 'employer-profile', labelKey: 'profile', icon: User },
];

export function BottomNav({ role, current, onNavigate }: { role: Role; current: string; onNavigate: (key: string) => void }) {
  const { t } = useStore();
  const items = role === 'worker' ? workerNav : employerNav;

  return (
    <nav className="sticky bottom-0 z-20 bg-white border-t border-slate-200 flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = current === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${active ? 'text-teal-700' : 'text-slate-400'}`}
          >
            <Icon size={26} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs font-semibold">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
