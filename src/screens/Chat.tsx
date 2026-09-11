import { useEffect, useRef, useState } from 'react';
import { Calendar, Send, User } from 'lucide-react';
import { useStore } from '@/store';
import { Button, Header, Screen } from '@/components/ui';
import type { Role } from '@/types';
import { PIPELINE_STATUSES } from '@/lib/hiring';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function stageRank(status: string): number {
  if (status === 'accepted' || status === 'onboarding') return 100;
  if (status === 'rejected') return -1;
  const index = PIPELINE_STATUSES.indexOf(status as (typeof PIPELINE_STATUSES)[number]);
  return index >= 0 ? index : 0;
}

export function EmployeeChatScreen({
  appId,
  role,
  onBack,
  onArrangeInterview,
}: {
  appId: string;
  role: Role;
  onBack: () => void;
  onArrangeInterview: () => void;
}) {
  const { t, session, applications, getJob, ensureChatSeeded, sendMessage, getMessages, setApplicationStatus } = useStore();

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = getMessages(appId);

  const application = applications.find((item) => item.id === appId);
  const job = application ? getJob(application.jobId) : undefined;

  const counterpartName = role === 'worker' ? job?.employerName || t('employer') : application?.workerName || t('iAmWorker');
  const jobTitle = job?.title || t('jobDetails');
  const jobSubtitle = role === 'worker' ? job?.location || '' : job?.employerName || '';

  const interviewArranged = application
    ? Boolean(application.interview) || stageRank(application.status) >= stageRank('interview')
    : false;

  useEffect(() => {
    ensureChatSeeded(appId);
  }, [appId, ensureChatSeeded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(appId, draft);
    setDraft('');
  };

  const handleArrangeInterview = () => {
    if (!application) {
      onArrangeInterview();
      return;
    }
    if (application.status === 'shortlisted' || application.status === 'employee_chat') {
      void setApplicationStatus(application.id, 'schedule_interview')
        .then(onArrangeInterview)
        .catch(onArrangeInterview);
      return;
    }
    onArrangeInterview();
  };

  return (
    <Screen className="bg-slate-100">
      <Header title={t('employeeChat')} onBack={onBack} />

      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200">
          {counterpartName ? initials(counterpartName) : <User size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate text-base">{counterpartName}</p>
          <p className="text-sm text-slate-600 truncate">
            {jobTitle}
            {jobSubtitle ? ` · ${jobSubtitle}` : ''}
          </p>
        </div>
      </div>

      {interviewArranged && (
        <div className="shrink-0 mx-4 mt-3 rounded-xl bg-green-50 border border-green-300 px-4 py-3 text-sm font-semibold text-green-900" role="status">
          {t('interviewScheduled')}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-slate-500 py-10">{t('chatEmpty')}</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === session?.userId;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-base leading-snug shadow-sm ${
                      mine
                        ? 'bg-teal-800 text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                    }`}
                  >
                    {message.text}
                  </div>
                  <span className="text-[11px] text-slate-400 px-1">{formatTime(message.at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 bg-white border-t border-slate-200 px-4 pt-3 pb-3 space-y-3">
        {interviewArranged ? (
          <Button fullWidth variant="secondary" disabled className="text-base py-3">
            <Calendar size={20} />
            {t('interviewArranged')}
          </Button>
        ) : (
          <Button fullWidth onClick={handleArrangeInterview} className="text-base py-3">
            <Calendar size={20} />
            {t('arrangeInterview')}
          </Button>
        )}

        <div className="flex gap-2 items-end">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chatPlaceholder')}
            className="flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="shrink-0 rounded-xl bg-teal-800 text-white p-3.5 disabled:opacity-40 active:bg-teal-900"
            aria-label={t('chatSend')}
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </Screen>
  );
}
