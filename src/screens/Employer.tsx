import { useState } from 'react';
import { Briefcase, MapPin, IndianRupee, Plus, Users, User, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ClipboardCheck, Wallet, Building2 } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Badge, Header, Field, TextInput, EmptyState } from '@/components/ui';
import type { Job, Application } from '@/types';

function formatSalary(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function EmployerHome({ onCreateJob, onOpenJob }: { onCreateJob: () => void; onOpenJob: (jobId: string) => void }) {
  const { t, jobs, session } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('myJobs')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <p className="text-lg font-semibold text-slate-700">
          {t('welcome')}, {session?.name}
        </p>

        <Button fullWidth onClick={onCreateJob} className="flex items-center justify-center gap-2">
          <Plus size={22} strokeWidth={2.5} />
          {t('createJob')}
        </Button>

        {myJobs.length === 0 ? (
          <EmptyState icon={<Briefcase size={48} />} title={t('noJobs')} />
        ) : (
          myJobs.map((job) => <EmployerJobCard key={job.id} job={job} onClick={() => onOpenJob(job.id)} />)
        )}
      </div>
    </div>
  );
}

function EmployerJobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const { t, getApplicationsForJob } = useStore();
  const applicantCount = getApplicationsForJob(job.id).length;

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.location}</p>
          </div>
        </div>
        <Badge color="neutral">
          <Users size={14} /> {applicantCount}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-2 text-slate-600">
        <IndianRupee size={18} className="text-green-600" />
        <span className="font-semibold">{formatSalary(job.salary)} {t('perMonth')}</span>
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
    }).then(onPublished).catch(() => undefined);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('createJob')} onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-5 pb-24">
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
      </div>
    </div>
  );
}

export function EmployerApplicants({ onOpenApplicant }: { onOpenApplicant: (appId: string) => void }) {
  const { t, jobs, getApplicationsForJob, session } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);
  const allApps: { app: Application; job: Job }[] = [];
  myJobs.forEach((job) => {
    getApplicationsForJob(job.id).forEach((app) => allApps.push({ app, job }));
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('applicants')} />
      <div className="flex-1 px-4 py-4 space-y-3 pb-24">
        {allApps.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title={t('noApplicants')} />
        ) : (
          allApps.map(({ app, job }) => (
            <Card key={app.id} onClick={() => onOpenApplicant(app.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={24} className="text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{app.workerName}</h3>
                    <p className="text-sm text-slate-500">{job.title}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const { t } = useStore();
  if (status === 'accepted') return <Badge color="accepted">{t('accepted')}</Badge>;
  if (status === 'rejected') return <Badge color="rejected">{t('rejected')}</Badge>;
  return <Badge color="pending">{t('pending')}</Badge>;
}

export function EmployerCandidate({ appId, onBack }: { appId: string; onBack: () => void }) {
  const { t, applications, getWorker, getJob, setApplicationStatus } = useStore();
  const app = applications.find((a) => a.id === appId);
  const job = app ? getJob(app.jobId) : undefined;
  const worker = app ? getWorker(app.workerId) : undefined;

  if (!app || !job || !worker) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title={t('candidateProfile')} onBack={onBack} />
        <EmptyState icon={<User size={48} />} title={t('noApplicants')} />
      </div>
    );
  }

  const handleAccept = () => setApplicationStatus(app.id, 'accepted');
  const handleReject = () => setApplicationStatus(app.id, 'rejected');

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('candidateProfile')} onBack={onBack} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{worker.name}</h2>
          <p className="text-slate-500">{job.title}</p>
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
              <MapPin size={20} className="text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">{t('distance')}</p>
                <p className="font-semibold text-slate-700">{worker.distanceKm} {t('km')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">{t('experience')}</p>
                <p className="font-semibold text-slate-700">{worker.experienceYears} {t('years')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-slate-700 mb-3">{t('skills')}</h3>
          <div className="flex flex-wrap gap-2">
            {worker.skills.map((skill) => (
              <span key={skill} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {app.status === 'accepted' ? (
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={28} className="text-green-600" />
              <p className="font-bold text-green-700 text-lg">{t('workerAccepted')}</p>
            </div>
          </Card>
        ) : app.status === 'rejected' ? (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle size={28} className="text-red-600" />
              <p className="font-bold text-red-700 text-lg">{t('rejected')}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <Button fullWidth variant="success" onClick={handleAccept} className="flex items-center justify-center gap-2">
              <CheckCircle2 size={22} />
              {t('accept')}
            </Button>
            <Button fullWidth variant="danger" onClick={handleReject} className="flex items-center justify-center gap-2">
              <XCircle size={22} />
              {t('reject')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmployerAttendance() {
  const { t, getHiredWorkersForEmployer, session, attendance, markAttendance } = useStore();
  const hired = getHiredWorkersForEmployer(session?.userId || '');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('attendance')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {hired.length === 0 ? (
          <EmptyState icon={<ClipboardCheck size={48} />} title={t('noWorkersHired')} />
        ) : (
          <>
            <p className="text-base font-semibold text-slate-500">{t('today')}: {today}</p>
            {hired.map(({ job, worker }) => {
              const record = attendance.find((a) => a.jobId === job.id && a.workerId === worker.id && a.date === today);
              return (
                <Card key={`${job.id}-${worker.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User size={24} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{worker.name}</h3>
                      <p className="text-sm text-slate-500">{job.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      variant={record?.present ? 'success' : 'outline'}
                      onClick={() => markAttendance(job.id, worker.id, today, true)}
                      className="flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      {t('present')}
                    </Button>
                    <Button
                      fullWidth
                      variant={record && !record.present ? 'danger' : 'outline'}
                      onClick={() => markAttendance(job.id, worker.id, today, false)}
                      className="flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} />
                      {t('absent')}
                    </Button>
                  </div>
                </Card>
              );
            })}

            <div className="pt-2">
              <h3 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Wallet size={20} className="text-green-600" />
                {t('payroll')}
              </h3>
              {hired.map(({ job, worker }) => {
                const workerAttendance = attendance.filter((a) => a.jobId === job.id && a.workerId === worker.id);
                const presentDays = workerAttendance.filter((a) => a.present).length;
                const dailySalary = Math.round(job.salary / 30);
                const pay = presentDays * dailySalary;
                return (
                  <Card key={`pay-${job.id}-${worker.id}`} className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-700">{worker.name}</span>
                      <span className="text-sm text-slate-500">{job.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{t('daysPresent')}: {presentDays}</span>
                      <span className="font-bold text-green-600">{t('estimatedPay')}: {formatSalary(pay)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function EmployerProfile({ onLogout }: { onLogout: () => void }) {
  const { t, session, jobs } = useStore();
  const myJobs = jobs.filter((j) => j.employerId === session?.userId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t('profile')} />
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={40} className="text-blue-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{session?.name}</h2>
          <p className="text-slate-500">{t('iAmEmployer')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge color="verified"><ShieldCheck size={14} /> {t('verified')}</Badge>
            <Badge color="neutral"><Briefcase size={14} /> {myJobs.length} {t('jobs')}</Badge>
          </div>
        </Card>

        <Button fullWidth variant="danger" onClick={onLogout}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}
