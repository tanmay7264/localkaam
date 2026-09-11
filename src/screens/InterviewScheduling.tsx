import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, MapPin, User, Video } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Card, Header, Screen, ScreenBody } from '@/components/ui';
import type { InterviewDetails, InterviewType, Role } from '@/types';

const DEMO_DATES = (() => {
  const dates: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 5; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
})();

const DEMO_TIMES = ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM'];

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function InterviewSchedulingScreen({
  appId,
  role,
  onBack,
}: {
  appId: string;
  role: Role;
  onBack: () => void;
}) {
  const { t, applications, getJob, scheduleInterview } = useStore();
  const application = applications.find((item) => item.id === appId);
  const job = application ? getJob(application.jobId) : undefined;

  const alreadyScheduled =
    Boolean(application?.interview) ||
    application?.status === 'interview' ||
    (Boolean(application?.interview) &&
      !!application &&
      ['verification', 'accepted', 'onboarding'].includes(application.status));

  const defaultInterviewer = role === 'worker' ? job?.employerName || 'Hiring Manager' : 'Hiring Manager';
  const defaultLocation = job?.location || 'Office';

  const [type, setType] = useState<InterviewType>(application?.interview?.type || 'online');
  const [date, setDate] = useState(application?.interview?.date || DEMO_DATES[0]);
  const [time, setTime] = useState(application?.interview?.time || DEMO_TIMES[0]);
  const [interviewerName, setInterviewerName] = useState(application?.interview?.interviewerName || defaultInterviewer);
  const [busy, setBusy] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const locationOrLink = useMemo(() => {
    if (type === 'online') return t('videoCallPlaceholder');
    return `${t('inPersonAt')} ${defaultLocation}`;
  }, [type, defaultLocation, t]);

  const showConfirmation = justConfirmed || Boolean(application?.interview);

  const handleConfirm = async () => {
    if (!application) return;
    setBusy(true);
    try {
      const details: InterviewDetails = {
        type,
        date,
        time,
        interviewerName: interviewerName.trim() || defaultInterviewer,
        locationOrLink,
        scheduledAt: Date.now(),
      };
      await scheduleInterview(application.id, details);
      setJustConfirmed(true);
    } finally {
      setBusy(false);
    }
  };

  const interview = application?.interview;

  if (!application || !job) {
    return (
      <Screen>
        <Header title={t('scheduleInterviewTitle')} onBack={onBack} />
        <ScreenBody>
          <p className="text-slate-600">{t('noApplications')}</p>
        </ScreenBody>
      </Screen>
    );
  }

  if (showConfirmation && interview) {
    return (
      <Screen>
        <Header title={t('scheduleInterviewTitle')} onBack={onBack} />
        <ScreenBody>
          <Card className="bg-green-50 border-green-300 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-green-700" />
            </div>
            <h2 className="text-2xl font-extrabold text-green-900">{t('interviewScheduled')}</h2>
            <p className="text-green-800 text-sm">{t('interviewScheduledStatus')}</p>
          </Card>

          <Card className="space-y-4">
            <Detail label={t('interviewDate')} value={formatDisplayDate(interview.date)} />
            <Detail label={t('interviewTime')} value={interview.time} />
            <Detail label={t('interviewerName')} value={interview.interviewerName} />
            <Detail
              label={t('interviewType')}
              value={interview.type === 'online' ? t('interviewOnline') : t('interviewInPerson')}
            />
            <Detail
              label={interview.type === 'online' ? t('videoCallLabel') : t('location')}
              value={interview.locationOrLink}
            />
            <Detail label={t('status')} value={t('interviewScheduledStatus')} />
          </Card>

          <Button fullWidth onClick={onBack}>
            {t('done')}
          </Button>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('scheduleInterviewTitle')} onBack={onBack} />
      <ScreenBody className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-500">{job.title}</p>
          <p className="text-lg font-bold text-slate-900">{job.employerName}</p>
        </div>

        <FieldGroup label={t('interviewType')}>
          <div className="grid grid-cols-2 gap-3">
            <TypeButton active={type === 'online'} onClick={() => setType('online')} icon={<Video size={20} />} label={t('interviewOnline')} />
            <TypeButton active={type === 'in_person'} onClick={() => setType('in_person')} icon={<MapPin size={20} />} label={t('interviewInPerson')} />
          </div>
        </FieldGroup>

        <FieldGroup label={t('availableDates')}>
          <div className="flex flex-wrap gap-2">
            {DEMO_DATES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDate(item)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold border-2 ${
                  date === item ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {formatDisplayDate(item)}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label={t('availableTimes')}>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_TIMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTime(item)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold border-2 ${
                  time === item ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label={t('interviewerName')}>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={interviewerName}
              onChange={(event) => setInterviewerName(event.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-4 py-3.5 text-base text-slate-900 outline-none focus:border-teal-600"
            />
          </div>
        </FieldGroup>

        <Card className="bg-slate-50 border-slate-200">
          <p className="text-sm font-semibold text-slate-500 mb-1">
            {type === 'online' ? t('videoCallLabel') : t('location')}
          </p>
          <p className="font-semibold text-slate-800 flex items-center gap-2">
            {type === 'online' ? <Video size={18} className="text-teal-800" /> : <MapPin size={18} className="text-teal-800" />}
            {locationOrLink}
          </p>
        </Card>

        <Button fullWidth disabled={busy || alreadyScheduled} onClick={() => void handleConfirm()}>
          <CalendarCheck size={22} />
          {t('confirmInterview')}
        </Button>
      </ScreenBody>
    </Screen>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-base font-semibold text-slate-800">{label}</p>
      {children}
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-4 flex flex-col items-center gap-2 font-semibold ${
        active ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
