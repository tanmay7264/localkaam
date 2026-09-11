import { useState } from 'react';
import {
  Briefcase,
  MapPin,
  IndianRupee,
  Plus,
  Users,
  User,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Wallet,
  Building2,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Badge, Header, Field, TextInput, EmptyState, Screen, ScreenBody } from '@/components/ui';
import { HiringJourney, ApplicationStatusProgress } from '@/components/HiringProgress';
import type { Job, Application, AppStatus } from '@/types';
import {
  canReject,
  isTerminalStatus,
  statusLabelKey,
  RECRUITER_STAGES,
  recruiterStageFor,
  recruiterStageLabelKey,
  recruiterActionsFor,
  recruiterActionLabelKey,
  primaryRecruiterAction,
  isVerificationComplete,
  type RecruiterAction,
  type RecruiterStage,
} from '@/lib/hiring';

function formatSalary(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function applicationBadgeColor(status: AppStatus): 'pending' | 'accepted' | 'rejected' | 'progress' {
  if (status === 'accepted' || status === 'onboarding') return 'accepted';
  if (status === 'rejected') return 'rejected';
  if (status === 'applied') return 'pending';
  return 'progress';
}

function RecruiterStageStrip({ application, compact = false }: { application: Application; compact?: boolean }) {
  const { t } = useStore();
  const current = recruiterStageFor(application);
  const currentIndex = RECRUITER_STAGES.indexOf(current);
  const rejected = application.status === 'rejected';
  const selected = application.status === 'accepted' || application.status === 'onboarding';

  return (
    <div className={compact ? 'mt-3' : ''}>
      {!compact && <h3 className="text-base font-bold text-slate-800 mb-3">{t('recruiterPipeline')}</h3>}
      <div className={`flex ${compact ? 'gap-1' : 'flex-wrap gap-2'}`}>
        {RECRUITER_STAGES.map((stage, index) => {
          const isCurrent = stage === current;
          const isDone = !rejected && index < currentIndex;
          const isDecisionRejected = stage === 'decision' && rejected;
          const isDecisionSelected = stage === 'decision' && selected;

          return (
            <span
              key={stage}
              className={[
                compact
                  ? 'text-[10px] font-semibold px-1.5 py-0.5 rounded-md'
                  : 'text-xs font-semibold px-2.5 py-1.5 rounded-lg',
                isDecisionRejected
                  ? 'bg-red-100 text-red-900'
                  : isDecisionSelected || isDone
                    ? 'bg-teal-100 text-teal-900'
                    : isCurrent
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {t(recruiterStageLabelKey(stage as RecruiterStage))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function EmployerHome({ onCreateJob, onOpenJob }: { onCreateJob: () => void; onOpenJob: (jobId: string) => void }) {
  const { t, jobs, session } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);

  return (
    <Screen>
      <Header title={t('myJobs')} />
      <ScreenBody>
        <p className="text-lg font-semibold text-slate-800">
          {t('welcome')}, {session?.name}
        </p>

        <Button fullWidth onClick={onCreateJob}>
          <Plus size={22} strokeWidth={2.5} />
          {t('createJob')}
        </Button>

        {myJobs.length === 0 ? (
          <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
        ) : (
          myJobs.map((job) => <EmployerJobCard key={job.id} job={job} onClick={() => onOpenJob(job.id)} />)
        )}
      </ScreenBody>
    </Screen>
  );
}

function EmployerJobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const { t, getApplicationsForJob } = useStore();
  const applicantCount = getApplicationsForJob(job.id).length;

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-sky-800" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
            <p className="text-sm text-slate-600 truncate">{job.location}</p>
          </div>
        </div>
        <Badge color="neutral">
          <Users size={14} /> {applicantCount}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-2 text-slate-800">
        <IndianRupee size={18} className="text-green-700" />
        <span className="font-semibold">
          {formatSalary(job.salary)} {t('perMonth')}
        </span>
      </div>
    </Card>
  );
}

export function EmployerCreateJob({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { t, createJob } = useStore();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [skills, setSkills] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState('1');

  const canPublish = title.trim() && location.trim() && salary.trim() && workingHours.trim();

  const handlePublish = () => {
    if (!canPublish) return;
    void createJob({
      title: title.trim(),
      location: location.trim(),
      salary: parseInt(salary, 10) || 0,
      workingHours: workingHours.trim(),
      skills: skills.trim() ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      workersNeeded: parseInt(workersNeeded, 10) || 1,
    })
      .then(onPublished)
      .catch(() => undefined);
  };

  return (
    <Screen>
      <Header title={t('createJob')} onBack={onBack} />
      <ScreenBody className="space-y-5">
        <Field label={t('jobTitle')}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sales Assistant" />
        </Field>
        <Field label={t('location')}>
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="FC Road, Pune" />
        </Field>
        <Field label={`${t('salary')} (₹)`}>
          <TextInput value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="15000" inputMode="numeric" />
        </Field>
        <Field label={t('workingHours')}>
          <TextInput value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="9:00 AM - 6:00 PM" />
        </Field>
        <Field label={t('requiredSkills')}>
          <TextInput value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Basic English, Cash Handling" />
        </Field>
        <Field label={t('numberOfWorkers')}>
          <TextInput value={workersNeeded} onChange={(e) => setWorkersNeeded(e.target.value)} inputMode="numeric" />
        </Field>

        <Button fullWidth onClick={handlePublish} disabled={!canPublish}>
          {t('publishJob')}
        </Button>
      </ScreenBody>
    </Screen>
  );
}

export function EmployerApplicants({
  onOpenApplicant,
  onOpenChat,
  onArrangeInterview,
  onOpenVerification,
}: {
  onOpenApplicant: (appId: string) => void;
  onOpenChat?: (appId: string) => void;
  onArrangeInterview?: (appId: string) => void;
  onOpenVerification?: (appId: string) => void;
}) {
  const { t, jobs, getApplicationsForJob, session, setApplicationStatus } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);
  const allApps: { app: Application; job: Job }[] = [];
  myJobs.forEach((job) => {
    getApplicationsForJob(job.id).forEach((app) => allApps.push({ app, job }));
  });

  const runPrimary = async (app: Application) => {
    const action = primaryRecruiterAction(app);
    if (!action) {
      onOpenApplicant(app.id);
      return;
    }
    switch (action) {
      case 'shortlist':
        await setApplicationStatus(app.id, 'shortlisted');
        break;
      case 'chat':
        if (app.status === 'shortlisted') {
          await setApplicationStatus(app.id, 'employee_chat');
        }
        onOpenChat?.(app.id);
        break;
      case 'arrange_interview':
        if (app.status === 'shortlisted' || app.status === 'employee_chat') {
          await setApplicationStatus(app.id, 'schedule_interview');
        }
        onArrangeInterview?.(app.id);
        break;
      case 'mark_interview_done':
        await setApplicationStatus(app.id, 'verification');
        break;
      case 'initiate_verification':
      case 'view_verification':
        onOpenVerification?.(app.id);
        break;
      case 'final_decision':
        onOpenApplicant(app.id);
        break;
      default:
        onOpenApplicant(app.id);
    }
  };

  return (
    <Screen>
      <Header title={t('applicants')} />
      <ScreenBody>
        {allApps.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title={t('noApplicants')} />
        ) : (
          allApps.map(({ app, job }) => {
            const primary = primaryRecruiterAction(app);
            return (
              <Card key={app.id} onClick={() => onOpenApplicant(app.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User size={24} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{app.workerName}</h3>
                      <p className="text-sm text-slate-600 truncate">{job.title}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <RecruiterStageStrip application={app} compact />
                {primary && (
                  <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                    <Button
                      fullWidth
                      variant="outline"
                      className="text-sm py-2.5"
                      onClick={() => void runPrimary(app)}
                    >
                      {t(recruiterActionLabelKey(primary))}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </ScreenBody>
    </Screen>
  );
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const { t } = useStore();
  return <Badge color={applicationBadgeColor(status)}>{t(statusLabelKey(status))}</Badge>;
}

export function EmployerCandidate({
  appId,
  onBack,
  onOpenChat,
  onOpenVerification,
  onArrangeInterview,
}: {
  appId: string;
  onBack: () => void;
  onOpenChat: (appId: string) => void;
  onOpenVerification?: (appId: string) => void;
  onArrangeInterview?: (appId: string) => void;
}) {
  const { t, applications, getWorker, getJob, setApplicationStatus } = useStore();
  const app = applications.find((a) => a.id === appId);
  const job = app ? getJob(app.jobId) : undefined;
  const worker = app ? getWorker(app.workerId) : undefined;
  const [busy, setBusy] = useState(false);

  if (!app || !job || !worker) {
    return (
      <Screen>
        <Header title={t('candidateProfile')} onBack={onBack} />
        <EmptyState icon={<User size={48} />} title={t('noApplicants')} />
      </Screen>
    );
  }

  const terminal = isTerminalStatus(app.status);
  const verificationDone = isVerificationComplete(app);
  const awaitingDecision = app.status === 'verification' && verificationDone;
  const showReject = canReject(app.status) && !awaitingDecision && !terminal;
  const actions = recruiterActionsFor(app);

  const runAction = async (action: RecruiterAction) => {
    setBusy(true);
    try {
      switch (action) {
        case 'shortlist':
          await setApplicationStatus(app.id, 'shortlisted');
          break;
        case 'chat':
          if (app.status === 'shortlisted') {
            await setApplicationStatus(app.id, 'employee_chat');
          }
          onOpenChat(app.id);
          break;
        case 'arrange_interview':
          if (app.status === 'shortlisted' || app.status === 'employee_chat') {
            await setApplicationStatus(app.id, 'schedule_interview');
          }
          onArrangeInterview?.(app.id);
          break;
        case 'mark_interview_done':
          await setApplicationStatus(app.id, 'verification');
          break;
        case 'initiate_verification':
        case 'view_verification':
          onOpenVerification?.(app.id);
          break;
        case 'final_decision':
          // Decision buttons render below when awaitingDecision
          break;
        default:
          break;
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = () => void setApplicationStatus(app.id, 'accepted');
  const handleNotSelect = () => void setApplicationStatus(app.id, 'rejected');
  const handleReject = () => void setApplicationStatus(app.id, 'rejected');

  return (
    <Screen>
      <Header title={t('candidateProfile')} onBack={onBack} />
      <ScreenBody>
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{worker.name}</h2>
          <p className="text-slate-600">{job.title}</p>
          <div className="mt-3 inline-flex">
            {worker.verified ? (
              <Badge color="verified">
                <ShieldCheck size={14} /> {t('verified')}
              </Badge>
            ) : (
              <Badge color="neutral">
                <ShieldAlert size={14} /> {t('notVerified')}
              </Badge>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-sm text-slate-500">{t('distance')}</p>
                <p className="font-semibold text-slate-800">
                  {worker.distanceKm} {t('km')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-sm text-slate-500">{t('experience')}</p>
                <p className="font-semibold text-slate-800">
                  {worker.experienceYears} {t('years')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-slate-800 mb-3">{t('skills')}</h3>
          <div className="flex flex-wrap gap-2">
            {worker.skills.map((skill) => (
              <span key={skill} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium text-sm">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <ApplicationStatusProgress application={app} />
        </Card>

        {actions.length > 0 && (
          <Card className="space-y-3">
            <h3 className="text-base font-bold text-slate-800">{t('recruiterActions')}</h3>
            {actions.map((action) => {
              if (action === 'final_decision') {
                return (
                  <div key={action} className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">{t('recruiterMakeDecision')}</p>
                    <Button fullWidth variant="success" disabled={busy} onClick={handleSelect}>
                      <CheckCircle2 size={22} />
                      {t('decisionSelected')}
                    </Button>
                    <Button fullWidth variant="outline" disabled={busy} onClick={handleNotSelect}>
                      {t('decisionNotSelected')}
                    </Button>
                  </div>
                );
              }
              return (
                <Button
                  key={action}
                  fullWidth
                  variant={action === actions[0] ? 'primary' : 'outline'}
                  disabled={busy}
                  onClick={() => void runAction(action)}
                >
                  {t(recruiterActionLabelKey(action))}
                </Button>
              );
            })}
          </Card>
        )}

        <Card>
          <HiringJourney
            application={app}
            role="employer"
            onOpenVerification={onOpenVerification}
            onOpenChat={onOpenChat}
            onArrangeInterview={onArrangeInterview}
          />
        </Card>

        {app.status === 'accepted' || app.status === 'onboarding' ? (
          <Card className="bg-green-50 border-green-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={28} className="text-green-700 shrink-0" />
              <p className="font-bold text-green-900 text-lg">{t('workerAccepted')}</p>
            </div>
          </Card>
        ) : app.status === 'rejected' ? (
          <Card className="bg-red-50 border-red-300">
            <div className="flex items-center gap-3">
              <XCircle size={28} className="text-red-700 shrink-0" />
              <p className="font-bold text-red-900 text-lg">{t('rejected')}</p>
            </div>
          </Card>
        ) : null}

        {showReject && (
          <Button fullWidth variant="danger" onClick={handleReject}>
            <XCircle size={22} />
            {t('reject')}
          </Button>
        )}

        {app.status === 'accepted' && (
          <Button fullWidth variant="success" onClick={() => void setApplicationStatus(app.id, 'onboarding')}>
            <CheckCircle2 size={22} />
            {t('advanceToOnboarding')}
          </Button>
        )}
      </ScreenBody>
    </Screen>
  );
}

export function EmployerAttendance() {
  const { t, getHiredWorkersForEmployer, session, attendance, markAttendance } = useStore();
  const hired = getHiredWorkersForEmployer(session?.userId || '');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <Header title={t('attendance')} />
      <ScreenBody>
        {hired.length === 0 ? (
          <EmptyState icon={<ClipboardCheck size={48} />} title={t('noWorkersHired')} />
        ) : (
          <>
            <p className="text-base font-semibold text-slate-600">
              {t('today')}: {today}
            </p>
            {hired.map(({ job, worker }) => {
              const record = attendance.find((a) => a.jobId === job.id && a.workerId === worker.id && a.date === today);
              return (
                <Card key={`${job.id}-${worker.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User size={24} className="text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{worker.name}</h3>
                      <p className="text-sm text-slate-600 truncate">{job.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      variant={record?.present ? 'success' : 'outline'}
                      onClick={() => markAttendance(job.id, worker.id, today, true)}
                    >
                      <CheckCircle2 size={20} />
                      {t('present')}
                    </Button>
                    <Button
                      fullWidth
                      variant={record && !record.present ? 'danger' : 'outline'}
                      onClick={() => markAttendance(job.id, worker.id, today, false)}
                    >
                      <XCircle size={20} />
                      {t('absent')}
                    </Button>
                  </div>
                </Card>
              );
            })}

            <div className="pt-2">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Wallet size={20} className="text-green-700" />
                {t('payroll')}
              </h3>
              {hired.map(({ job, worker }) => {
                const workerAttendance = attendance.filter((a) => a.jobId === job.id && a.workerId === worker.id);
                const presentDays = workerAttendance.filter((a) => a.present).length;
                const dailySalary = Math.round(job.salary / 30);
                const pay = presentDays * dailySalary;
                return (
                  <Card key={`pay-${job.id}-${worker.id}`} className="mb-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-semibold text-slate-800 truncate">{worker.name}</span>
                      <span className="text-sm text-slate-600 shrink-0">{job.title}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-700">
                        {t('daysPresent')}: {presentDays}
                      </span>
                      <span className="font-bold text-green-800">
                        {t('estimatedPay')}: {formatSalary(pay)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </ScreenBody>
    </Screen>
  );
}

export function EmployerProfile({ onLogout }: { onLogout: () => void }) {
  const { t, session, jobs } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);

  return (
    <Screen>
      <Header title={t('profile')} />
      <ScreenBody>
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={40} className="text-sky-800" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{session?.name}</h2>
          <p className="text-slate-600">{t('iAmEmployer')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge color="verified">
              <ShieldCheck size={14} /> {t('verified')}
            </Badge>
            <Badge color="neutral">
              <Briefcase size={14} /> {myJobs.length} {t('jobs')}
            </Badge>
          </div>
        </Card>

        <Button fullWidth variant="danger" onClick={onLogout}>
          {t('logout')}
        </Button>
      </ScreenBody>
    </Screen>
  );
}
