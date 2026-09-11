import { useState } from 'react';
import { Building2, ChevronRight, ExternalLink, Globe, HardHat, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store';
import { languages } from '@/i18n';
import { Button, Card, Field, TextInput } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase';
import { startDigiLockerVerification, withdrawVerification } from '@/lib/verification';
import type { Role } from '@/types';

export function LanguageScreen({ onContinue }: { onContinue: () => void }) {
  const { t, language, setLanguage } = useStore();
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-teal-800 to-teal-950">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 border border-white/25">
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
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between rounded-2xl px-6 py-5 text-xl font-semibold transition-all border ${
                  active
                    ? 'bg-white text-teal-900 border-white shadow-lg'
                    : 'bg-teal-900/55 text-white border-white/35 active:bg-teal-900/75'
                }`}
              >
                <span>{lang.native}</span>
                {active && <ChevronRight size={24} className="text-teal-900" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-sm mt-10">
        <Button fullWidth variant="inverse" onClick={onContinue}>
          {t('continue')}
        </Button>
        {!isSupabaseConfigured && <p className="mt-4 text-center text-sm text-teal-100">{t('demoMode')}</p>}
      </div>
    </div>
  );
}

export function RoleScreen({ onChoose }: { onChoose: (role: Role) => void }) {
  const { t } = useStore();
  return (
    <div className="min-h-full flex flex-col px-6 py-12 bg-slate-50">
      <div className="text-center mb-10 mt-8">
        <h2 className="text-2xl font-bold text-slate-900">{t('chooseRole')}</h2>
      </div>
      <div className="space-y-4 max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={() => onChoose('worker')}
          className="w-full bg-white rounded-3xl p-8 shadow-md border-2 border-slate-200 active:border-teal-600 flex flex-col items-center gap-3 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
            <HardHat size={36} className="text-teal-800" />
          </div>
          <span className="text-xl font-bold text-slate-900">{t('iAmWorker')}</span>
          <span className="text-sm text-slate-600">{t('findWork')}</span>
        </button>
        <button
          type="button"
          onClick={() => onChoose('employer')}
          className="w-full bg-white rounded-3xl p-8 shadow-md border-2 border-slate-200 active:border-teal-600 flex flex-col items-center gap-3 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center">
            <Building2 size={36} className="text-sky-800" />
          </div>
          <span className="text-xl font-bold text-slate-900">{t('iAmEmployer')}</span>
          <span className="text-sm text-slate-600">{t('postJob')}</span>
        </button>
      </div>
    </div>
  );
}

export function LoginScreen({ role, onDone }: { role: Role; onDone: () => void }) {
  const { t, requestPhoneOtp, verifyPhoneOtp, error, clearError } = useStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const isWorker = role === 'worker';

  const submit = async () => {
    setBusy(true);
    setFormError('');
    clearError();
    try {
      if (step === 'phone') {
        if (!/^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s-]/g, ''))) throw new Error('Enter a valid phone number with country code.');
        await requestPhoneOtp(phone.replace(/[\s-]/g, ''));
        setStep('otp');
      } else if (step === 'otp') {
        if (isSupabaseConfigured && !/^\d{6}$/.test(token)) throw new Error('Enter the 6-digit OTP.');
        setStep('profile');
      } else {
        if (!name.trim()) throw new Error('Enter your name.');
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
        await verifyPhoneOtp({ phone, token, role, name, email });
        onDone();
      }
    } catch (submissionError) {
      setFormError(submissionError instanceof Error ? submissionError.message : error || 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col px-6 py-12 bg-slate-50">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isWorker ? 'bg-teal-100' : 'bg-sky-100'}`}>
          {isWorker ? <HardHat size={40} className="text-teal-800" /> : <Building2 size={40} className="text-sky-800" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{t('login')}</h2>
        <div className="w-full space-y-5">
          {step === 'phone' && (
            <Field label={t('phoneNumber')}>
              <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" />
            </Field>
          )}
          {step === 'otp' && (
            <Field label={t('enterOtp')}>
              <TextInput value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={isSupabaseConfigured ? '123456' : 'Demo: any value'} inputMode="numeric" autoComplete="one-time-code" />
            </Field>
          )}
          {step === 'profile' && (
            <>
              <Field label={t('enterName')}>
                <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={isWorker ? 'Ramesh Patil' : 'Sharma Electronics'} autoComplete="name" />
              </Field>
              <Field label={t('emailAddress')}>
                <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
              </Field>
            </>
          )}
          {(formError || error) && (
            <p className="rounded-xl bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-800" role="alert">
              {formError || error}
            </p>
          )}
          <Button fullWidth onClick={() => void submit()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={24} /> : step === 'phone' ? t('sendOtp') : step === 'otp' ? t('continue') : t('verifyAndContinue')}
          </Button>
          {step !== 'phone' && (
            <button type="button" className="w-full text-sm font-semibold text-teal-800 py-2" onClick={() => setStep(step === 'profile' ? 'otp' : 'phone')}>
              {t('back')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerificationScreen() {
  const { t, session, refreshProfile, sendEmailVerification, logout, deleteAccount } = useStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete this action.');
    } finally {
      setBusy(false);
    }
  };

  const status = session?.verificationStatus;
  const emailVerified = session?.emailVerified;

  return (
    <div className="min-h-full bg-slate-50 px-6 py-12">
      <div className="max-w-sm mx-auto space-y-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={42} className="text-teal-800" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('identityVerification')}</h1>
          <p className="text-slate-600 mt-2">{t('identityVerificationHelp')}</p>
        </div>

        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <MailCheck className={emailVerified ? 'text-green-700' : 'text-amber-700'} />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900">{t('emailVerification')}</h2>
              <p className="text-sm text-slate-600 mt-1">{t('emailVerificationHelp')}</p>
              {!emailVerified && (
                <Button variant="outline" className="mt-3 text-base py-3" onClick={() => void run(() => sendEmailVerification(session?.email || ''), t('emailVerification'))} disabled={busy}>
                  {t('resendEmail')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className={status === 'verified' ? 'text-green-700' : 'text-teal-800'} />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900">{t('identityVerification')}</h2>
              <p className="text-sm text-slate-600 mt-1">{t('consentBody')}</p>
              <p className="text-sm text-slate-600 mt-2">{t('consentData')} {t('consentRetention')}</p>
              {status === 'pending' && <p className="mt-3 text-sm font-semibold text-amber-800">{t('verificationPending')}</p>}
              {status === 'needs_review' && <p className="mt-3 text-sm font-semibold text-amber-800">{t('verificationReview')}</p>}
              {status === 'rejected' || status === 'expired' ? <p className="mt-3 text-sm font-semibold text-red-800">{t('verificationFailed')}</p> : null}
              {status === 'verified' ? (
                <p className="mt-3 text-sm font-semibold text-green-800">{t('verificationSuccess')}</p>
              ) : (
                <Button fullWidth className="mt-4" onClick={() => void run(startDigiLockerVerification, t('verificationPending'))} disabled={busy || !emailVerified}>
                  {busy ? <Loader2 className="animate-spin" size={20} /> : <ExternalLink size={20} />}
                  {t('verifyWithDigiLocker')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {message && (
          <p className="rounded-xl bg-white border border-slate-300 px-4 py-3 text-sm text-slate-700" role="status">
            {message}
          </p>
        )}
        {status === 'verified' && (
          <Button
            variant="outline"
            fullWidth
            onClick={() =>
              void run(async () => {
                await withdrawVerification();
                await refreshProfile();
              }, t('verificationFailed'))
            }
          >
            {t('withdrawVerification')}
          </Button>
        )}
        <button
          type="button"
          className="w-full text-sm font-semibold text-red-700 py-2"
          onClick={() => {
            if (window.confirm(t('deleteAccountConfirm'))) void run(deleteAccount, t('accountDeleted'));
          }}
        >
          {t('deleteAccount')}
        </button>
        <Button variant="outline" fullWidth onClick={() => void logout()}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}
