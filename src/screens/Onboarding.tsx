import { useState } from 'react';
import { HardHat, Building2, Globe, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { languages } from '@/i18n';
import { Button, Field, TextInput } from '@/components/ui';
import type { Role } from '@/types';

export function LanguageScreen({ onContinue }: { onContinue: () => void }) {
  const { t, language, setLanguage } = useStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-teal-700 to-teal-900">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-6 backdrop-blur">
          <HardHat size={44} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">{t('appName')}</h1>
        <p className="text-teal-100 text-lg mt-2">{t('tagline')}</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 text-white mb-4">
          <Globe size={22} />
          <p className="text-lg font-semibold">{t('selectLanguage')}</p>
        </div>
        <div className="space-y-3">
          {languages.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between rounded-2xl px-6 py-5 text-xl font-semibold transition-all ${
                  active
                    ? 'bg-white text-teal-800 shadow-lg'
                    : 'bg-white/15 text-white active:bg-white/25'
                }`}
              >
                <span>{lang.native}</span>
                {active && <ChevronRight size={24} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-sm mt-10">
        <Button fullWidth onClick={onContinue} className="bg-white text-teal-800 active:bg-teal-50">
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}

export function RoleScreen({ onChoose }: { onChoose: (role: Role) => void }) {
  const { t } = useStore();
  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-slate-50">
      <div className="text-center mb-10 mt-8">
        <h2 className="text-2xl font-bold text-slate-800">{t('chooseRole')}</h2>
      </div>
      <div className="space-y-4 max-w-sm mx-auto w-full">
        <button
          onClick={() => onChoose('worker')}
          className="w-full bg-white rounded-3xl p-8 shadow-md border-2 border-transparent active:border-teal-500 flex flex-col items-center gap-3 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
            <HardHat size={36} className="text-teal-700" />
          </div>
          <span className="text-xl font-bold text-slate-800">{t('iAmWorker')}</span>
          <span className="text-sm text-slate-500">{t('findWork')}</span>
        </button>

        <button
          onClick={() => onChoose('employer')}
          className="w-full bg-white rounded-3xl p-8 shadow-md border-2 border-transparent active:border-teal-500 flex flex-col items-center gap-3 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Building2 size={36} className="text-blue-700" />
          </div>
          <span className="text-xl font-bold text-slate-800">{t('iAmEmployer')}</span>
          <span className="text-sm text-slate-500">{t('postJob')}</span>
        </button>
      </div>
    </div>
  );
}

export function LoginScreen({ role, onDone }: { role: Role; onDone: () => void }) {
  const { t, login } = useStore();
  const [name, setName] = useState('');
  const isWorker = role === 'worker';

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-slate-50">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isWorker ? 'bg-teal-100' : 'bg-blue-100'}`}>
          {isWorker ? <HardHat size={40} className="text-teal-700" /> : <Building2 size={40} className="text-blue-700" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-8">{t('login')}</h2>
        <div className="w-full space-y-5">
          <Field label={t('enterName')}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isWorker ? 'Ramesh Patil' : 'Sharma Electronics'}
            />
          </Field>
          <Button
            fullWidth
            onClick={() => {
              login(role, name.trim() || (isWorker ? 'Ramesh Patil' : 'Sharma Electronics'));
              onDone();
            }}
          >
            {t('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
