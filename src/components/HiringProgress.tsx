import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui';
import type { AppStatus, Application, PipelinePeakStage, Role } from '@/types';
import {
  HIRING_STEPS,
  getCompletedThroughIndex,
  getHiringStepIndex,
  hiringStepLabelKey,
  isJourneyCtaStage,
  journeyCtaConfirmKey,
  journeyCtaLabelKey,
  peakStageFor,
  type JourneyCtaStage,
} from '@/lib/hiring';

function formatInterviewDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function HiringJourney({
  application,
  role,
  onOpenVerification,
  onOpenChat,
  onArrangeInterview,
}: {
  application: Application;
  role: Role;
  onOpenVerification?: (appId: string) => void;
  onOpenChat?: (appId: string) => void;
  onArrangeInterview?: (appId: string) => void;
}) {
  const { t, markStageAction, setApplicationStatus, getJob } = useStore();
  const { status, peakStage, stageActions = {}, id: appId, interview, jobId, hiringVerification } = application;
  const job = getJob(jobId);
  const verificationDone = hiringVerification?.status === 'completed' || Boolean(stageActions.verification);
  const awaitingDecision = status === 'verification' && verificationDone;
  const currentIndex = getHiringStepIndex(status, peakStage, { verificationDone });
  const completedThrough = getCompletedThroughIndex(status, peakStage, { verificationDone });
  const peakIndex = HIRING_STEPS.indexOf(peakStageFor(status, peakStage) as (typeof HIRING_STEPS)[number]);
  const rejected = status === 'rejected';
  const accepted = status === 'accepted' || status === 'onboarding';
  const showUpcomingInterview = Boolean(interview) && status === 'interview';
  const showVerificationCard = status === 'verification' && !verificationDone;
  const showDecisionCard =
    awaitingDecision ||
    ((accepted || rejected) && (verificationDone || peakStage === 'verification' || peakStage === 'onboarding'));

  const [sheet, setSheet] = useState<JourneyCtaStage | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmAction = async (stage: JourneyCtaStage) => {
    setBusy(true);
    try {
      if (stage === 'under_review') {
        await setApplicationStatus(appId, 'shortlisted');
        await markStageAction(appId, stage);
        setSheet(null);
        return;
      }
      if (stage === 'interview') {
        await markStageAction(appId, stage);
        await setApplicationStatus(appId, 'verification');
        setSheet(null);
        return;
      }
      if (stage === 'onboarding') {
        await setApplicationStatus(appId, 'onboarding');
        await markStageAction(appId, stage);
        setSheet(null);
        return;
      }
      await markStageAction(appId, stage);
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  const openCta = async (stage: JourneyCtaStage) => {
    if (stage === 'under_review' || stage === 'interview' || stage === 'onboarding') {
      setSheet(stage);
      return;
    }

    setBusy(true);
    try {
      if (stage === 'shortlisted') {
        if (status === 'shortlisted') {
          await setApplicationStatus(appId, 'employee_chat');
        }
        onOpenChat?.(appId);
        return;
      }

      if (stage === 'employee_chat' || stage === 'schedule_interview') {
        if (status === 'shortlisted' || status === 'employee_chat') {
          await setApplicationStatus(appId, 'schedule_interview');
        }
        onArrangeInterview?.(appId);
        return;
      }

      if (stage === 'verification') {
        onOpenVerification?.(appId);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = async () => {
    setDeciding(true);
    try {
      await setApplicationStatus(appId, 'accepted');
    } finally {
      setDeciding(false);
    }
  };

  const handleNotSelect = async () => {
    setDeciding(true);
    try {
      await setApplicationStatus(appId, 'rejected');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="space-y-1">
      {showUpcomingInterview && interview && (
        <div className="mb-5 rounded-2xl border-2 border-teal-200 bg-teal-50/80 p-4 space-y-3">
          <h3 className="text-base font-bold text-teal-950">{t('upcomingInterview')}</h3>
          <dl className="space-y-2.5">
            <InterviewDetail label={t('interviewDate')} value={formatInterviewDate(interview.date)} />
            <InterviewDetail label={t('interviewTime')} value={interview.time} />
            <InterviewDetail label={t('interviewer')} value={interview.interviewerName} />
            <InterviewDetail label={t('position')} value={job?.title || '—'} />
            <InterviewDetail
              label={t('interviewType')}
              value={interview.type === 'online' ? t('interviewOnline') : t('interviewInPerson')}
            />
            <InterviewDetail label={t('status')} value={t('interviewScheduledStatus')} />
          </dl>
        </div>
      )}

      {showVerificationCard && (
        <div className="mb-5 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4 space-y-3">
          <h3 className="text-base font-bold text-amber-950">{t('verificationRequiredTitle')}</h3>
          <p className="text-sm text-amber-950/80 leading-relaxed">{t('verificationRequiredHelp')}</p>
          <Button fullWidth variant="outline" className="text-base py-3" onClick={() => onOpenVerification?.(appId)}>
            {t('ctaStartVerification')}
          </Button>
        </div>
      )}

      {showDecisionCard && (
        <div
          className={[
            'mb-5 rounded-2xl border-2 p-4 space-y-3',
            rejected
              ? 'border-red-200 bg-red-50/80'
              : accepted
                ? 'border-green-200 bg-green-50/80'
                : 'border-teal-200 bg-teal-50/80',
          ].join(' ')}
        >
          <h3
            className={[
              'text-base font-bold',
              rejected ? 'text-red-950' : accepted ? 'text-green-950' : 'text-teal-950',
            ].join(' ')}
          >
            {t('applicationDecision')}
          </h3>

          {awaitingDecision ? (
            <>
              <p className="text-sm text-teal-950/80 leading-relaxed">{t('applicationDecisionHelp')}</p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-teal-900/80">{t('status')}</span>
                  <span className="font-semibold text-slate-700">{t('decisionPending')}</span>
                </div>
                <Button fullWidth variant="success" className="text-base py-3" disabled={deciding} onClick={() => void handleSelect()}>
                  {t('decisionSelected')}
                </Button>
                <Button fullWidth variant="outline" className="text-base py-3" disabled={deciding} onClick={() => void handleNotSelect()}>
                  {t('decisionNotSelected')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className={['text-sm', rejected ? 'text-red-900/80' : 'text-green-900/80'].join(' ')}>{t('status')}</span>
              <span className={['text-sm font-bold', rejected ? 'text-red-900' : 'text-green-900'].join(' ')}>
                {rejected ? t('decisionNotSelected') : t('decisionSelected')}
              </span>
            </div>
          )}
        </div>
      )}

      <h3 className="text-base font-bold text-slate-800 mb-3">{t('hiringJourney')}</h3>
      <ol className="space-y-0">
        {HIRING_STEPS.map((step, index) => {
          const isFinal = step === 'final_decision';
          const isOnboarding = step === 'onboarding';
          const isRejectedFinal = isFinal && rejected;
          const isAcceptedFinal = isFinal && accepted && !rejected;

          let isCompleted = false;
          let isCurrent = false;
          let isUpcoming = false;

          if (rejected) {
            if (isFinal) {
              isCompleted = false;
              isCurrent = true;
            } else if (isOnboarding) {
              isUpcoming = true;
            } else {
              isCompleted = index <= peakIndex;
              isUpcoming = index > peakIndex;
            }
          } else if (status === 'onboarding') {
            if (isOnboarding) {
              isCurrent = true;
            } else if (isFinal || index < HIRING_STEPS.indexOf('onboarding')) {
              isCompleted = true;
            }
          } else if (status === 'accepted') {
            if (isOnboarding) {
              isCurrent = true;
            } else if (isFinal) {
              isCompleted = true;
            } else {
              isCompleted = true;
            }
          } else if (awaitingDecision) {
            if (isOnboarding) {
              isUpcoming = true;
            } else if (isFinal) {
              isCurrent = true;
            } else if (index <= HIRING_STEPS.indexOf('verification')) {
              isCompleted = true;
            } else {
              isUpcoming = true;
            }
          } else if (isFinal || isOnboarding) {
            isUpcoming = true;
          } else {
            isCompleted = index < currentIndex;
            isCurrent = index === currentIndex;
            isUpcoming = index > currentIndex;
          }

          let label = t(hiringStepLabelKey(step));
          if (
            step === 'interview' &&
            status !== 'interview' &&
            status !== 'schedule_interview' &&
            (verificationDone ||
              accepted ||
              status === 'verification' ||
              currentIndex > HIRING_STEPS.indexOf('interview'))
          ) {
            label = t('stageInterviewCompleted');
          }
          if (
            step === 'verification' &&
            (verificationDone || accepted || (rejected && peakIndex >= HIRING_STEPS.indexOf('verification')))
          ) {
            label = t('stageVerificationCompleted');
          }
          if (isAcceptedFinal || (isFinal && awaitingDecision)) label = t('stageFinalDecision');
          if (isRejectedFinal) label = t('stageFinalDecision');

          const connectorFilled =
            rejected
              ? index < peakIndex
              : accepted
                ? index < HIRING_STEPS.indexOf('onboarding')
                : awaitingDecision
                  ? index < HIRING_STEPS.indexOf('verification')
                  : index < completedThrough;

          const showCta =
            isCurrent &&
            !showVerificationCard &&
            !awaitingDecision &&
            ((status === 'accepted' && isOnboarding) ||
              (status === 'onboarding' && isOnboarding) ||
              (isJourneyCtaStage(status) && step === status));

          const ctaStage: JourneyCtaStage | null = showCta
            ? status === 'accepted'
              ? 'onboarding'
              : isJourneyCtaStage(status)
                ? status
                : null
            : null;

          const actionDone =
            ctaStage && (ctaStage === 'under_review' || ctaStage === 'interview' || ctaStage === 'onboarding')
              ? Boolean(stageActions[ctaStage])
              : false;

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                    isRejectedFinal
                      ? 'bg-red-700 border-red-700 text-white'
                      : isCompleted || isAcceptedFinal
                        ? 'bg-teal-800 border-teal-800 text-white'
                        : isCurrent
                          ? 'bg-white border-teal-700 text-teal-800 ring-4 ring-teal-100'
                          : 'bg-slate-100 border-slate-300 text-slate-400',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isRejectedFinal ? (
                    <X size={16} strokeWidth={3} />
                  ) : isCompleted || isAcceptedFinal ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isCurrent ? (
                    <span className="text-sm font-bold">→</span>
                  ) : (
                    <span className="text-xs font-bold">○</span>
                  )}
                </div>
                {index < HIRING_STEPS.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[20px] my-1 ${connectorFilled ? 'bg-teal-700' : 'bg-slate-200'}`} />
                )}
              </div>
              <div className={`pt-1 min-w-0 flex-1 ${index === HIRING_STEPS.length - 1 ? 'pb-0' : 'pb-4'}`}>
                <p
                  className={[
                    'text-base leading-tight',
                    isRejectedFinal
                      ? 'font-bold text-red-800'
                      : isCurrent || isAcceptedFinal
                        ? 'font-bold text-slate-900'
                        : isCompleted
                          ? 'font-semibold text-slate-800'
                          : isUpcoming
                            ? 'font-medium text-slate-400'
                            : 'font-medium text-slate-600',
                  ].join(' ')}
                >
                  {label}
                </p>
                {isCurrent && awaitingDecision && isFinal && (
                  <p className="text-sm text-teal-800 mt-0.5">{t('currentStage')}</p>
                )}
                {isCurrent && status !== 'rejected' && !ctaStage && !awaitingDecision && step === 'final_decision' && (
                  <p className="text-sm text-slate-600 mt-1">{t('waitingFinalDecision')}</p>
                )}
                {isCurrent && !ctaStage && !isFinal && status !== 'rejected' && status !== 'verification' && (
                  <p className="text-sm text-teal-800 mt-0.5">{t('currentStage')}</p>
                )}
                {ctaStage && (
                  <div className="mt-2">
                    {actionDone ? (
                      <Button fullWidth variant="secondary" disabled className="text-base py-3">
                        {t('ctaDone')}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outline"
                        className="text-base py-3"
                        disabled={busy}
                        onClick={() => void openCta(ctaStage)}
                      >
                        {t(journeyCtaLabelKey(ctaStage, role))}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-4" onClick={() => setSheet(null)}>
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-slide-up mb-6 sm:mb-0"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h4 className="text-lg font-bold text-slate-900 mb-2">{t(journeyCtaLabelKey(sheet, role))}</h4>
            <p className="text-slate-600 mb-4">{t(journeyCtaConfirmKey(sheet))}</p>
            <div className="space-y-2">
              <Button fullWidth disabled={busy} onClick={() => void confirmAction(sheet)}>
                {sheet === 'interview'
                  ? t('ctaInterviewCompleted')
                  : sheet === 'under_review'
                    ? t('ctaContinueShortlist')
                    : sheet === 'onboarding'
                      ? t(journeyCtaLabelKey('onboarding', role))
                      : t('confirm')}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setSheet(null)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-sm text-teal-800/80 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 text-right">{value}</dd>
    </div>
  );
}

/** @deprecated Use HiringJourney */
export function HiringProgress({
  status,
  peakStage,
  application,
  role = 'worker',
}: {
  status?: AppStatus;
  peakStage?: PipelinePeakStage;
  application?: Application;
  role?: Role;
}) {
  if (application) return <HiringJourney application={application} role={role} />;
  const fallback: Application = {
    id: 'tmp',
    jobId: '',
    workerId: '',
    workerName: '',
    status: status || 'applied',
    appliedAt: Date.now(),
    peakStage,
    stageActions: {},
  };
  return <HiringJourney application={fallback} role={role} />;
}
