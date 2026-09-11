import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Header, Screen, ScreenBody } from '@/components/ui';
import {
  HIRING_VERIFICATION_ITEMS,
  checkItemStatusLabelKey,
  createInitialHiringVerification,
  hiringVerificationItemLabelKey,
} from '@/lib/hiring';
import type { CheckItemStatus, HiringVerification, HiringVerificationItemKey, Role } from '@/types';

const STEP_MS = 900;

function statusGlyph(status: CheckItemStatus): string {
  if (status === 'completed') return '✓';
  if (status === 'in_progress') return '⏳';
  return '○';
}

export function HiringVerificationScreen({
  appId,
  role,
  onBack,
}: {
  appId: string;
  role: Role;
  onBack: () => void;
}) {
  const { t, applications, getJob, setHiringVerification } = useStore();
  const application = applications.find((item) => item.id === appId);
  const job = application ? getJob(application.jobId) : undefined;
  const saved = application?.hiringVerification;

  const [local, setLocal] = useState<HiringVerification>(() => saved || createInitialHiringVerification());
  const [running, setRunning] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (saved) setLocal(saved);
  }, [saved]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  if (!application || !job) {
    return (
      <Screen>
        <Header title={t('stageThirdPartyVerification')} onBack={onBack} />
        <ScreenBody>
          <p className="text-slate-600">{t('noApplications')}</p>
        </ScreenBody>
      </Screen>
    );
  }

  const isCompleted = local.status === 'completed';
  const canStart = local.status === 'required' && !running;

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const persist = async (next: HiringVerification) => {
    setLocal(next);
    await setHiringVerification(appId, next);
  };

  const handleStart = () => {
    if (!canStart) return;
    clearTimers();
    setRunning(true);

    const started: HiringVerification = {
      status: 'in_progress',
      startedAt: Date.now(),
      items: {
        identity: 'in_progress',
        contact: 'pending',
        employment: 'pending',
        documents: 'pending',
      },
    };
    void persist(started);

    HIRING_VERIFICATION_ITEMS.forEach((key, index) => {
      const completeDelay = (index + 1) * STEP_MS;

      timersRef.current.push(
        window.setTimeout(() => {
          setLocal((current) => {
            const items = { ...current.items };
            items[key] = 'completed';
            const nextKey = HIRING_VERIFICATION_ITEMS[index + 1] as HiringVerificationItemKey | undefined;
            if (nextKey) items[nextKey] = 'in_progress';

            const next: HiringVerification =
              index === HIRING_VERIFICATION_ITEMS.length - 1
                ? {
                    status: 'completed',
                    startedAt: current.startedAt || Date.now(),
                    completedAt: Date.now(),
                    items,
                  }
                : {
                    ...current,
                    status: 'in_progress',
                    items,
                  };

            void setHiringVerification(appId, next);
            if (next.status === 'completed') setRunning(false);
            return next;
          });
        }, completeDelay),
      );
    });
  };

  return (
    <Screen>
      <Header title={t('stageThirdPartyVerification')} onBack={onBack} />
      <ScreenBody className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-500">{job.title}</p>
          <p className="text-lg font-bold text-slate-900">
            {role === 'employer' ? application.workerName : job.employerName}
          </p>
        </div>

        {isCompleted ? (
          <Card className="bg-green-50 border-green-300 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-green-700" />
            </div>
            <h2 className="text-2xl font-extrabold text-green-900">{t('verificationCompleted')}</h2>
            <p className="text-green-800 text-sm">{t('verificationCompletedHelp')}</p>
          </Card>
        ) : (
          <Card className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-amber-800" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{t('verificationRequiredTitle')}</h2>
                <p className="text-slate-600 mt-1 text-sm leading-relaxed">{t('verificationRequiredHelp')}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 mb-3">{t('verificationChecks')}</h3>
          <ul className="space-y-3">
            {HIRING_VERIFICATION_ITEMS.map((key) => {
              const itemStatus = local.items[key];
              return (
                <li
                  key={key}
                  className={[
                    'flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3',
                    itemStatus === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : itemStatus === 'in_progress'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={[
                        'text-lg w-7 text-center shrink-0',
                        itemStatus === 'completed'
                          ? 'text-green-700'
                          : itemStatus === 'in_progress'
                            ? 'text-amber-700'
                            : 'text-slate-400',
                      ].join(' ')}
                      aria-hidden
                    >
                      {statusGlyph(itemStatus)}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm sm:text-base">
                      {t(hiringVerificationItemLabelKey(key))}
                    </span>
                  </div>
                  <span
                    className={[
                      'text-xs sm:text-sm font-semibold shrink-0',
                      itemStatus === 'completed'
                        ? 'text-green-800'
                        : itemStatus === 'in_progress'
                          ? 'text-amber-800'
                          : 'text-slate-500',
                    ].join(' ')}
                  >
                    {t(checkItemStatusLabelKey(itemStatus))}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        {canStart && (
          <Button fullWidth onClick={handleStart}>
            {t('ctaStartVerification')}
          </Button>
        )}

        {running && (
          <p className="text-center text-sm font-semibold text-amber-800">{t('verificationSimulating')}</p>
        )}

        {isCompleted && (
          <Button fullWidth onClick={onBack}>
            {t('done')}
          </Button>
        )}
      </ScreenBody>
    </Screen>
  );
}
