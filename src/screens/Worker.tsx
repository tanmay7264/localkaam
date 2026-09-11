import { Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, ClipboardList, Wallet, User, Star } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Badge, Header, EmptyState } from '@/components/ui';
import type { Job, Application } from '@/types';

function formatSalary(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function WorkerHome({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const { t, jobs, session } = useStore();
  const nearby = jobs.filter((j) => j.published);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('nearbyJobs')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <p className="text-lg font-semibold text-slate-700">
          {t('welcome')}, {session?.name}
        </p>
        {nearby.length === 0 ? (
          <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
        ) : (
          nearby.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job.id)} />)
        )}
      </div>
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const { t } = useStore();
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-teal-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.employerName}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-slate-600">
          <IndianRupee size={18} className="text-green-600" />
          <span className="font-semibold">{formatSalary(job.salary)} {t('perMonth')}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin size={18} className="text-slate-400" />
          <span>{job.location}</span>
          <span className="text-slate-400">·</span>
          <span className="font-medium">{job.distanceKm} {t('km')}</span>
        </div>
      </div>
      <div className="mt-4">
        <Button fullWidth variant="primary" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          {t('applyNow')}
        </Button>
      </div>
    </Card>
  );
}

export function WorkerJobDetails({ jobId, onBack, onApplied }: { jobId: string; onBack: () => void; onApplied: () => void }) {
  const { t, getJob, applyToJob, getWorkerApplications, session } = useStore();
  const job = getJob(jobId);

  if (!job) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title={t('jobDetails')} onBack={onBack} />
        <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
      </div>
    );
  }

  const alreadyApplied = getWorkerApplications(session?.userId || '').some((a) => a.jobId === jobId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('jobDetails')} onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center">
              <Briefcase size={28} className="text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
              <p className="text-slate-500">{job.employerName}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <DetailRow icon={<IndianRupee size={20} className="text-green-600" />} label={t('salary')} value={`${formatSalary(job.salary)} ${t('perMonth')}`} />
            <DetailRow icon={<MapPin size={20} className="text-slate-400" />} label={t('location')} value={`${job.location} · ${job.distanceKm} ${t('km')}`} />
            <DetailRow icon={<Clock size={20} className="text-slate-400" />} label={t('workingHours')} value={job.workingHours} />
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-slate-700 mb-3">{t('requiredSkills')}</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {alreadyApplied ? (
          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-amber-600" />
              <p className="font-semibold text-amber-700 text-lg">{t('alreadyApplied')}</p>
            </div>
          </Card>
        ) : (
          <Button fullWidth onClick={() => { applyToJob(jobId); onApplied(); }}>
            {t('apply')}
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-base font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

export function WorkerApplications({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const { t, getWorkerApplications, getJob, session } = useStore();
  const apps = getWorkerApplications(session?.userId || '');

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('myApplications')} />
      <div className="flex-1 px-4 py-4 space-y-3 pb-24">
        {apps.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} />} title={t('noApplications')} message={t('notApplied')} />
        ) : (
          apps.map((app) => {
            const job = getJob(app.jobId);
            if (!job) return null;
            return <ApplicationCard key={app.id} app={app} job={job} onClick={() => onOpenJob(job.id)} />;
          })
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, job, onClick }: { app: Application; job: Job; onClick: () => void }) {
  const { t } = useStore();
  const statusColor = app.status === 'accepted' ? 'accepted' : app.status === 'rejected' ? 'rejected' : 'pending';
  const statusLabel = app.status === 'accepted' ? t('accepted') : app.status === 'rejected' ? t('rejected') : t('pending');

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-teal-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.employerName}</p>
          </div>
        </div>
        <Badge color={statusColor}>{statusLabel}</Badge>
      </div>
      {app.status === 'accepted' && (
        <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 border border-green-200">
          <p className="text-green-700 font-bold text-lg">{t('youreHired')}</p>
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
      <div className="flex flex-col min-h-screen">
        <Header title={t('myJob')} />
        <EmptyState icon={<Briefcase size={48} />} title={t('noJobYet')} message={t('noJobYetMsg')} />
      </div>
    );
  }

  const myAttendance = attendance.filter((a) => a.jobId === job.id && a.workerId === session?.userId);
  const presentDays = myAttendance.filter((a) => a.present).length;
  const dailySalary = Math.round(job.salary / 30);
  const earnings = presentDays * dailySalary;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('myJob')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="text-green-600" />
            <div>
              <p className="text-xl font-extrabold text-green-700">{t('youreHired')}</p>
              <p className="text-green-600">{t('hiredMsg')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center">
              <Briefcase size={28} className="text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
              <p className="text-slate-500">{job.employerName}</p>
            </div>
          </div>
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <DetailRow icon={<MapPin size={20} className="text-slate-400" />} label={t('workplace')} value={job.location} />
            <DetailRow icon={<Clock size={20} className="text-slate-400" />} label={t('shift')} value={job.workingHours} />
            <DetailRow icon={<IndianRupee size={20} className="text-green-600" />} label={t('salary')} value={`${formatSalary(job.salary)} ${t('perMonth')}`} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={22} className="text-teal-700" />
            <h3 className="text-base font-bold text-slate-700">{t('attendance')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{t('daysPresent')}</span>
            <span className="text-lg font-bold text-slate-800">{presentDays} / {t('totalDays')}</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={22} className="text-green-600" />
            <h3 className="text-base font-bold text-slate-700">{t('earnings')}</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{t('salaryPerDay')}</span>
              <span className="font-semibold text-slate-700">{formatSalary(dailySalary)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-600">{t('estimatedPay')}</span>
              <span className="text-xl font-extrabold text-green-600">{formatSalary(earnings)}</span>
            </div>
          </div>
        </Card>

        <Button fullWidth variant="outline" onClick={() => onOpenJob(job.id)}>
          {t('jobDetails')}
        </Button>
      </div>
    </div>
  );
}

export function WorkerProfile({ onLogout }: { onLogout: () => void }) {
  const { t, session, getAcceptedJobForWorker } = useStore();
  const job = getAcceptedJobForWorker(session?.userId || '');

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('profile')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-teal-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{session?.name}</h2>
          <p className="text-slate-500">{t('iAmWorker')}</p>
          {job && (
            <div className="mt-3 inline-flex">
              <Badge color="accepted">
                <Star size={14} /> {job.title}
              </Badge>
            </div>
          )}
        </Card>

        <Button fullWidth variant="danger" onClick={onLogout}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}
