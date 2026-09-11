import { useState } from 'react';
import { Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, ClipboardList, Wallet, User, Star, ShieldCheck, ChevronRight, XCircle, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Badge, Header, EmptyState, Screen, ScreenBody } from '@/components/ui';
import { HiringJourney } from '@/components/HiringProgress';
import type { Job, Application, AppStatus } from '@/types';
import { outcomeBannerKey, statusLabelKey } from '@/lib/hiring';
import { DEMO_FALLBACK_PHONE, whatsappUrl } from '@/seed';

function formatSalary(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function applicationBadgeColor(status: AppStatus): 'pending' | 'accepted' | 'rejected' | 'progress' {
  if (status === 'accepted' || status === 'onboarding') return 'accepted';
  if (status === 'rejected') return 'rejected';
  if (status === 'applied') return 'pending';
  return 'progress';
}

export function WorkerHome({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const { t, jobs, session } = useStore();
  const nearby = jobs.filter((j) => j.published);

  return (
    <Screen>
      <Header title={t('nearbyJobs')} />
      <ScreenBody>
        <p className="text-lg font-semibold text-slate-800">
          {t('welcome')}, {session?.name}
        </p>
        {nearby.length === 0 ? (
          <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
        ) : (
          nearby.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job.id)} />)
        )}
      </ScreenBody>
    </Screen>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const { t } = useStore();
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-teal-800" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
            <p className="text-sm text-slate-600 truncate">{job.employerName}</p>
          </div>
        </div>
        <ChevronRight size={22} className="text-slate-400 shrink-0 mt-1" aria-hidden />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-slate-800">
          <IndianRupee size={18} className="text-green-700" />
          <span className="font-semibold">
            {formatSalary(job.salary)} {t('perMonth')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin size={18} className="text-slate-500" />
          <span>{job.location}</span>
          <span className="text-slate-400">·</span>
          <span className="font-medium">
            {job.distanceKm} {t('km')}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function WorkerJobDetails({
  jobId,
  onBack,
  onApplied,
  onOpenChat,
  onOpenVerification,
  onArrangeInterview,
}: {
  jobId: string;
  onBack: () => void;
  onApplied: () => void;
  onOpenChat: (appId: string) => void;
  onOpenVerification?: (appId: string) => void;
  onArrangeInterview?: (appId: string) => void;
}) {
  const { t, getJob, applyToJob, getWorkerApplications, session, setApplicationStatus } = useStore();
  const [showApplicationSheet, setShowApplicationSheet] = useState(false);
  const job = getJob(jobId);

  if (!job) {
    return (
      <Screen>
        <Header title={t('jobDetails')} onBack={onBack} />
        <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
      </Screen>
    );
  }

  const application = getWorkerApplications(session?.userId || '').find((a) => a.jobId === jobId);
  const alreadyApplied = Boolean(application);
  const showShortlistedActions = application && (application.status === 'shortlisted' || application.status === 'employee_chat');
  const contactPhone = job.employerPhone || DEMO_FALLBACK_PHONE;

  const handleChat = () => {
    if (!application) return;
    const open = () => onOpenChat(application.id);
    if (application.status === 'shortlisted') {
      void setApplicationStatus(application.id, 'employee_chat').then(open).catch(open);
      return;
    }
    open();
  };

  return (
    <Screen>
      <Header title={t('jobDetails')} onBack={onBack} />
      <ScreenBody>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Briefcase size={28} className="text-teal-800" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600">{job.employerName}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-200">
            <DetailRow icon={<IndianRupee size={20} className="text-green-700" />} label={t('salary')} value={`${formatSalary(job.salary)} ${t('perMonth')}`} />
            <DetailRow icon={<MapPin size={20} className="text-slate-500" />} label={t('location')} value={`${job.location} · ${job.distanceKm} ${t('km')}`} />
            <DetailRow icon={<Clock size={20} className="text-slate-500" />} label={t('workingHours')} value={job.workingHours} />
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-slate-800 mb-3">{t('requiredSkills')}</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium text-sm">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {alreadyApplied && application ? (
          <>
            {showShortlistedActions ? (
              <Card className="bg-teal-50 border-teal-300 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={28} className="text-teal-800 shrink-0" />
                  <p className="font-bold text-teal-950 text-xl">{t('youveBeenShortlisted')}</p>
                </div>
                <div className="space-y-3">
                  <Button fullWidth onClick={handleChat}>
                    <MessageCircle size={22} />
                    {t('chatWithEmployee')}
                  </Button>
                  <Button fullWidth variant="outline" onClick={() => setShowApplicationSheet(true)}>
                    {t('viewApplication')}
                  </Button>
                </div>
              </Card>
            ) : (
              <ApplicationOutcomeBanner status={application.status} />
            )}
            <Card>
              <HiringJourney
                application={application}
                role="worker"
                onOpenVerification={onOpenVerification}
                onOpenChat={onOpenChat}
                onArrangeInterview={onArrangeInterview}
              />
            </Card>
          </>
        ) : (
          <Button
            fullWidth
            onClick={() => {
              void applyToJob(jobId).then(onApplied).catch(() => undefined);
            }}
          >
            {t('apply')}
          </Button>
        )}
      </ScreenBody>

      {showApplicationSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowApplicationSheet(false)}>
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-slide-up mb-6 sm:mb-0 space-y-4"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-xl font-bold text-slate-900">{t('viewApplication')}</h3>
            <div className="space-y-2 text-slate-800">
              <p className="font-semibold text-lg">{job.title}</p>
              <p>{job.employerName}</p>
              <p className="text-slate-600">{job.location}</p>
              <p className="font-semibold text-green-800">
                {formatSalary(job.salary)} {t('perMonth')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-500">{t('employerContact')}</p>
              <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Phone size={18} className="text-teal-800" />
                {contactPhone}
              </p>
            </div>
            <Button
              fullWidth
              onClick={() => {
                window.open(whatsappUrl(contactPhone), '_blank', 'noopener,noreferrer');
              }}
            >
              {t('openWhatsApp')}
            </Button>
            <Button fullWidth variant="outline" onClick={() => setShowApplicationSheet(false)}>
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function ApplicationOutcomeBanner({ status }: { status: AppStatus }) {
  const { t } = useStore();
  if (status === 'accepted') {
    return (
      <Card className="bg-green-50 border-green-300">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-green-700 shrink-0" />
          <p className="font-semibold text-green-900 text-lg">{t('youreHired')}</p>
        </div>
      </Card>
    );
  }
  if (status === 'rejected') {
    return (
      <Card className="bg-red-50 border-red-300">
        <div className="flex items-center gap-3">
          <XCircle size={24} className="text-red-700 shrink-0" />
          <p className="font-semibold text-red-900 text-lg">{t('applicationRejected')}</p>
        </div>
      </Card>
    );
  }
  return (
    <Card className="bg-amber-50 border-amber-300">
      <div className="flex items-center gap-3">
        <CheckCircle2 size={24} className="text-amber-700 shrink-0" />
        <p className="font-semibold text-amber-900 text-lg">{t(outcomeBannerKey(status))}</p>
      </div>
    </Card>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-base font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function WorkerApplications({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const { t, getWorkerApplications, getJob, session } = useStore();
  const apps = getWorkerApplications(session?.userId || '');

  return (
    <Screen>
      <Header title={t('myApplications')} />
      <ScreenBody>
        {apps.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} />} title={t('noApplications')} message={t('notApplied')} />
        ) : (
          apps.map((app) => {
            const job = getJob(app.jobId);
            if (!job) return null;
            return <ApplicationCard key={app.id} app={app} job={job} onClick={() => onOpenJob(job.id)} />;
          })
        )}
      </ScreenBody>
    </Screen>
  );
}

function ApplicationCard({ app, job, onClick }: { app: Application; job: Job; onClick: () => void }) {
  const { t } = useStore();

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-teal-800" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
            <p className="text-sm text-slate-600 truncate">{job.employerName}</p>
          </div>
        </div>
        <Badge color={applicationBadgeColor(app.status)}>{t(statusLabelKey(app.status))}</Badge>
      </div>
      {app.status === 'accepted' && (
        <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 border border-green-300">
          <p className="text-green-900 font-bold text-lg">{t('youreHired')}</p>
        </div>
      )}
    </Card>
  );
}

export function WorkerMyJob({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const { t, getAcceptedJobForWorker, session, attendance } = useStore();
  const job = getAcceptedJobForWorker(session?.userId || '');

  if (!job) {
    return (
      <Screen>
        <Header title={t('myJob')} />
        <EmptyState icon={<Briefcase size={48} />} title={t('noJobYet')} message={t('noJobYetMsg')} />
      </Screen>
    );
  }

  const myAttendance = attendance.filter((a) => a.jobId === job.id && a.workerId === session?.userId);
  const presentDays = myAttendance.filter((a) => a.present).length;
  const dailySalary = Math.round(job.salary / 30);
  const earnings = presentDays * dailySalary;

  return (
    <Screen>
      <Header title={t('myJob')} />
      <ScreenBody>
        <Card className="bg-green-50 border-green-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="text-green-700 shrink-0" />
            <div>
              <p className="text-xl font-extrabold text-green-900">{t('youreHired')}</p>
              <p className="text-green-800">{t('hiredMsg')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Briefcase size={28} className="text-teal-800" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600">{job.employerName}</p>
            </div>
          </div>
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <DetailRow icon={<MapPin size={20} className="text-slate-500" />} label={t('workplace')} value={job.location} />
            <DetailRow icon={<Clock size={20} className="text-slate-500" />} label={t('shift')} value={job.workingHours} />
            <DetailRow icon={<IndianRupee size={20} className="text-green-700" />} label={t('salary')} value={`${formatSalary(job.salary)} ${t('perMonth')}`} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={22} className="text-teal-800" />
            <h3 className="text-base font-bold text-slate-800">{t('attendance')}</h3>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-700">{t('daysPresent')}</span>
            <span className="text-lg font-bold text-slate-900">
              {presentDays} / {t('totalDays')}
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={22} className="text-green-700" />
            <h3 className="text-base font-bold text-slate-800">{t('earnings')}</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-700">{t('salaryPerDay')}</span>
              <span className="font-semibold text-slate-800">{formatSalary(dailySalary)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <span className="text-slate-700">{t('estimatedPay')}</span>
              <span className="text-xl font-extrabold text-green-800">{formatSalary(earnings)}</span>
            </div>
          </div>
        </Card>

        <Button fullWidth variant="outline" onClick={() => onOpenJob(job.id)}>
          {t('jobDetails')}
        </Button>
      </ScreenBody>
    </Screen>
  );
}

export function WorkerProfile({ onLogout }: { onLogout: () => void }) {
  const { t, session, getAcceptedJobForWorker } = useStore();
  const job = getAcceptedJobForWorker(session?.userId || '');

  return (
    <Screen>
      <Header title={t('profile')} />
      <ScreenBody>
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-teal-800" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{session?.name}</h2>
          <p className="text-slate-600">{t('iAmWorker')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge color="verified">
              <ShieldCheck size={14} /> {t('verified')}
            </Badge>
            {job && (
              <Badge color="accepted">
                <Star size={14} /> {job.title}
              </Badge>
            )}
          </div>
        </Card>

        <Button fullWidth variant="danger" onClick={onLogout}>
          {t('logout')}
        </Button>
      </ScreenBody>
    </Screen>
  );
}
