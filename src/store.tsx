import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  Language,
  Role,
  Session,
  Job,
  Application,
  WorkerProfile,
  AttendanceRecord,
  AppStatus,
  VerificationStatus,
  ChatMessage,
  InterviewDetails,
  HiringVerification,
} from './types';
import { makeT } from './i18n';
import { seedJobs, seedApplications, seedWorkers, seedAttendance } from './seed';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { normalizeAppStatus } from './lib/hiring';

interface StoreState {
  language: Language;
  session: Session | null;
  jobs: Job[];
  applications: Application[];
  workers: WorkerProfile[];
  attendance: AttendanceRecord[];
  messagesByAppId: Record<string, ChatMessage[]>;
  loading: boolean;
  authReady: boolean;
  error: string | null;
}

interface StoreContextValue extends StoreState {
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  requestPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (data: { phone: string; token: string; role: Role; name: string; email: string }) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  createJob: (data: Omit<Job, 'id' | 'employerId' | 'employerName' | 'employerPhone' | 'published' | 'createdAt' | 'distanceKm'>) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
  setApplicationStatus: (appId: string, status: AppStatus) => Promise<void>;
  markStageAction: (appId: string, stageKey: string) => Promise<void>;
  scheduleInterview: (appId: string, details: InterviewDetails) => Promise<void>;
  setHiringVerification: (appId: string, hiringVerification: HiringVerification) => Promise<void>;
  markAttendance: (jobId: string, workerId: string, date: string, present: boolean) => Promise<void>;
  ensureChatSeeded: (appId: string) => void;
  sendMessage: (appId: string, text: string) => void;
  getMessages: (appId: string) => ChatMessage[];
  getJob: (id: string) => Job | undefined;
  getApplicationsForJob: (jobId: string) => Application[];
  getWorkerApplications: (workerId: string) => Application[];
  getWorker: (id: string) => WorkerProfile | undefined;
  getAcceptedJobForWorker: (workerId: string) => Job | undefined;
  getHiredWorkersForEmployer: (employerId: string) => { job: Job; worker: WorkerProfile; app: Application }[];
}

const STORAGE_KEY = 'local-kaam-demo-state-v2';

function loadDemoState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const applications = Array.isArray(parsed.applications)
        ? parsed.applications.map((application: Application) => {
            const status = normalizeAppStatus(String(application.status || 'applied'));
            const peakRaw = application.peakStage ? normalizeAppStatus(String(application.peakStage)) : undefined;
            const peakStage =
              peakRaw && peakRaw !== 'accepted' && peakRaw !== 'rejected'
                ? peakRaw
                : status !== 'accepted' && status !== 'rejected'
                  ? status
                  : 'applied';
            return {
              ...application,
              status,
              peakStage,
              stageActions: application.stageActions || {},
              interview: application.interview,
              hiringVerification: application.hiringVerification,
            };
          })
        : seedApplications;
      return {
        language: parsed.language || 'en',
        session: parsed.session || null,
        jobs: mergeJobsWithSeedPhones(parsed.jobs?.length ? parsed.jobs : seedJobs),
        applications,
        workers: parsed.workers?.length ? parsed.workers : seedWorkers,
        attendance: parsed.attendance || seedAttendance,
        messagesByAppId: parsed.messagesByAppId && typeof parsed.messagesByAppId === 'object' ? parsed.messagesByAppId : {},
        loading: false,
        authReady: true,
        error: null,
      };
    }
  } catch {
    // fall through to defaults
  }
  return {
    language: 'en',
    session: null,
    jobs: seedJobs,
    applications: seedApplications,
    workers: seedWorkers,
    attendance: seedAttendance,
    messagesByAppId: {},
    loading: false,
    authReady: true,
    error: null,
  };
}

function mergeJobsWithSeedPhones(jobs: Job[]): Job[] {
  return jobs.map((job) => {
    if (job.employerPhone) return job;
    const seed = seedJobs.find((item) => item.id === job.id);
    return seed?.employerPhone ? { ...job, employerPhone: seed.employerPhone } : job;
  });
}

const emptyRemoteState: StoreState = {
  language: 'en',
  session: null,
  jobs: [],
  applications: [],
  workers: [],
  attendance: [],
  messagesByAppId: {},
  loading: true,
  authReady: false,
  error: null,
};

type ProfileRow = {
  id: string;
  role: Role;
  display_name: string;
  email: string | null;
  phone: string | null;
  verification_status: VerificationStatus;
  verification_expires_at: string | null;
};

function toJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    title: String(row.title),
    employerId: String(row.employer_id),
    employerName: String(row.employer_name),
    employerPhone: row.employer_phone ? String(row.employer_phone) : undefined,
    location: String(row.location),
    salary: Number(row.salary),
    workingHours: String(row.working_hours),
    skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
    workersNeeded: Number(row.workers_needed),
    distanceKm: Number(row.distance_km || 0),
    published: Boolean(row.published),
    createdAt: new Date(String(row.created_at)).getTime(),
  };
}

function toApplication(row: Record<string, unknown>): Application {
  const status = normalizeAppStatus(String(row.status || 'applied'));
  const peakRaw = row.peak_stage != null ? normalizeAppStatus(String(row.peak_stage)) : undefined;
  const peakStage =
    peakRaw && peakRaw !== 'accepted' && peakRaw !== 'rejected'
      ? peakRaw
      : status !== 'accepted' && status !== 'rejected'
        ? status
        : 'applied';
  let stageActions: Application['stageActions'];
  if (row.stage_actions && typeof row.stage_actions === 'object' && !Array.isArray(row.stage_actions)) {
    stageActions = row.stage_actions as Application['stageActions'];
  }
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    workerId: String(row.worker_id),
    workerName: String(row.worker_name),
    status,
    appliedAt: new Date(String(row.applied_at)).getTime(),
    peakStage,
    stageActions,
  };
}

function toWorker(row: Record<string, unknown>): WorkerProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
    experienceYears: Number(row.experience_years || 0),
    distanceKm: Number(row.distance_km || 0),
    verified: Boolean(row.verified),
  };
}

function toAttendance(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    workerId: String(row.worker_id),
    date: String(row.date),
    present: Boolean(row.present),
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => (isSupabaseConfigured ? emptyRemoteState : loadDemoState()));

  const hydrate = useCallback(async (authSession: { user: { id: string; email?: string; phone?: string; email_confirmed_at?: string | null }; access_token: string } | null) => {
    if (!supabase) return;
    if (!authSession) {
      setState((current) => ({ ...current, session: null, jobs: [], applications: [], workers: [], attendance: [], loading: false, authReady: true }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null, authReady: true }));
    const userId = authSession.user.id;
    const [profileResult, jobsResult, applicationsResult, workersResult, attendanceResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*').order('applied_at', { ascending: false }),
      supabase.from('worker_directory').select('*'),
      supabase.from('attendance').select('*').order('date', { ascending: false }),
    ]);
    const firstError = [profileResult, jobsResult, applicationsResult, workersResult, attendanceResult].find((result) => result.error)?.error;
    if (firstError) {
      setState((current) => ({ ...current, loading: false, error: firstError.message }));
      return;
    }
    const profile = profileResult.data as ProfileRow | null;
    if (!profile) {
      setState((current) => ({ ...current, session: null, loading: false }));
      return;
    }

    const verificationStatus = profile.verification_status === 'verified' && profile.verification_expires_at && new Date(profile.verification_expires_at).getTime() <= Date.now()
      ? 'expired'
      : profile.verification_status;
    setState((current) => ({
      ...current,
      session: {
        role: profile.role,
        userId,
        name: profile.display_name,
        email: profile.email || authSession.user.email || '',
        phone: profile.phone || authSession.user.phone || '',
        emailVerified: Boolean(authSession.user.email_confirmed_at),
        verificationStatus,
      },
      jobs: (jobsResult.data || []).map((row) => toJob(row as Record<string, unknown>)),
      applications: (applicationsResult.data || []).map((row) => toApplication(row as Record<string, unknown>)),
      workers: (workersResult.data || []).map((row) => toWorker(row as Record<string, unknown>)),
      attendance: (attendanceResult.data || []).map((row) => toAttendance(row as Record<string, unknown>)),
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void hydrate(data.session as typeof data.session & { access_token: string });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (active) void hydrate(authSession as typeof authSession & { access_token: string });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [hydrate]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      language: state.language,
      session: state.session,
      jobs: state.jobs,
      applications: state.applications,
      workers: state.workers,
      attendance: state.attendance,
      messagesByAppId: state.messagesByAppId,
    }));
  }, [state]);

  const t = makeT(state.language);
  const requireVerified = () => {
    if (state.session?.verificationStatus !== 'verified') throw new Error(t('verificationRequired'));
  };

  const value: StoreContextValue = {
    ...state,
    t,
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    requestPhoneOtp: async (phone) => {
      setState((current) => ({ ...current, error: null }));
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    verifyPhoneOtp: async ({ phone, token, role, name, email }) => {
      setState((current) => ({ ...current, error: null }));
      if (!supabase) {
        setState((current) => ({ ...current, session: { role, userId: role === 'worker' ? 'worker-demo' : 'emp-1', name: name.trim() || (role === 'worker' ? 'Ramesh Patil' : 'Sharma Electronics'), email, phone, emailVerified: true, verificationStatus: 'verified' } }));
        return;
      }
      const { data, error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: token.trim(), type: 'sms' });
      if (error) throw error;
      if (!data.user || !data.session) throw new Error('Supabase did not return a session.');
      const displayName = name.trim() || (role === 'worker' ? 'Ramesh Patil' : 'My Business');
      const existingProfile = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
      if (existingProfile.error) throw existingProfile.error;
      const profileResult = existingProfile.data
        ? await supabase.from('profiles').update({ display_name: displayName, email: email.trim() || null, phone: phone.trim() }).eq('id', data.user.id)
        : await supabase.from('profiles').insert({ id: data.user.id, role, display_name: displayName, email: email.trim() || null, phone: phone.trim() });
      if (profileResult.error) throw profileResult.error;
      if (role === 'worker') {
        const { error: workerError } = await supabase.from('worker_profiles').upsert({ id: data.user.id, name: displayName });
        if (workerError) throw workerError;
      }
      if (email.trim() && email.trim() !== data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) throw emailError;
      }
      await hydrate(data.session);
    },
    sendEmailVerification: async (email) => {
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from('profiles').update({ email: email.trim() }).eq('id', data.user.id);
    },
    refreshProfile: async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      await hydrate(data.session);
    },
    logout: async () => {
      if (supabase) await supabase.auth.signOut();
      setState((current) => ({ ...current, session: null, jobs: isSupabaseConfigured ? [] : current.jobs, applications: isSupabaseConfigured ? [] : current.applications }));
    },
    deleteAccount: async () => {
      if (!supabase) {
        setState((current) => ({ ...current, session: null }));
        return;
      }
      const { error } = await supabase.functions.invoke('account-delete', { body: {} });
      if (error) throw error;
      await supabase.auth.signOut();
      setState((current) => ({ ...current, session: null, jobs: [], applications: [], workers: [], attendance: [] }));
    },
    clearError: () => setState((current) => ({ ...current, error: null })),
    createJob: async (data) => {
      try {
        requireVerified();
        if (!state.session) return;
        if (!supabase) {
          const job: Job = {
            ...data,
            id: `job-${Date.now()}`,
            employerId: state.session.userId,
            employerName: state.session.name,
            employerPhone: state.session.phone || undefined,
            distanceKm: 0,
            published: true,
            createdAt: Date.now(),
          };
          setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
          return;
        }
        const { data: row, error } = await supabase.from('jobs').insert({ title: data.title, employer_id: state.session.userId, employer_name: state.session.name, location: data.location, salary: data.salary, working_hours: data.workingHours, skills: data.skills, workers_needed: data.workersNeeded }).select('*').single();
        if (error) throw error;
        setState((current) => ({ ...current, jobs: [toJob(row as Record<string, unknown>), ...current.jobs] }));
      } catch (error) {
        setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Unable to create the job.' }));
        throw error;
      }
    },
    applyToJob: async (jobId) => {
      try {
        requireVerified();
        if (!state.session) return;
        if (!supabase) {
          const existing = state.applications.find((application) => application.jobId === jobId && application.workerId === state.session!.userId);
          if (existing) return;
          const application: Application = {
            id: `app-${Date.now()}`,
            jobId,
            workerId: state.session.userId,
            workerName: state.session.name,
            status: 'under_review',
            appliedAt: Date.now(),
            peakStage: 'under_review',
            stageActions: {},
          };
          setState((current) => ({ ...current, applications: [application, ...current.applications] }));
          return;
        }
        const { data: row, error } = await supabase.from('applications').insert({ job_id: jobId, worker_id: state.session.userId, worker_name: state.session.name, status: 'under_review', peak_stage: 'under_review' }).select('*').single();
        if (error) throw error;
        const created = toApplication(row as Record<string, unknown>);
        setState((current) => ({
          ...current,
          applications: [{ ...created, status: 'under_review', peakStage: 'under_review' }, ...current.applications],
        }));
      } catch (error) {
        setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Unable to apply for this job.' }));
        throw error;
      }
    },
    setApplicationStatus: async (appId, status) => {
      const updateLocal = (application: Application): Application => {
        const previousPeak =
          application.status !== 'accepted' && application.status !== 'rejected'
            ? application.status
            : application.peakStage || 'applied';
        const peakStage =
          status === 'accepted' || status === 'rejected'
            ? previousPeak === 'onboarding'
              ? 'verification'
              : previousPeak
            : status;
        return { ...application, status, peakStage };
      };
      if (!supabase) {
        setState((current) => ({
          ...current,
          applications: current.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      const current = state.applications.find((application) => application.id === appId);
      const previousPeak =
        current && current.status !== 'accepted' && current.status !== 'rejected'
          ? current.status
          : current?.peakStage || 'applied';
      const peakStage =
        status === 'accepted' || status === 'rejected'
          ? previousPeak === 'onboarding'
            ? 'verification'
            : previousPeak
          : status;
      const { error } = await supabase.from('applications').update({ status, peak_stage: peakStage }).eq('id', appId);
      if (error) throw error;
      setState((currentState) => ({
        ...currentState,
        applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
      }));
    },
    markStageAction: async (appId, stageKey) => {
      const updateLocal = (application: Application): Application => ({
        ...application,
        stageActions: { ...application.stageActions, [stageKey]: true },
      });
      if (!supabase) {
        setState((current) => ({
          ...current,
          applications: current.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      const current = state.applications.find((application) => application.id === appId);
      const stageActions = { ...current?.stageActions, [stageKey]: true };
      const { error } = await supabase.from('applications').update({ stage_actions: stageActions }).eq('id', appId);
      if (error) {
        // Column may not exist yet — still update local UI
        setState((currentState) => ({
          ...currentState,
          applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      setState((currentState) => ({
        ...currentState,
        applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
      }));
    },
    scheduleInterview: async (appId, details) => {
      const updateLocal = (application: Application): Application => ({
        ...application,
        status: 'interview',
        peakStage: 'interview',
        interview: details,
        stageActions: { ...application.stageActions, schedule_interview: true },
      });
      if (!supabase) {
        setState((current) => ({
          ...current,
          applications: current.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'interview',
          peak_stage: 'interview',
          interview_details: details,
        })
        .eq('id', appId);
      if (error) {
        setState((currentState) => ({
          ...currentState,
          applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      setState((currentState) => ({
        ...currentState,
        applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
      }));
    },
    setHiringVerification: async (appId, hiringVerification) => {
      const updateLocal = (application: Application): Application => ({
        ...application,
        hiringVerification,
        stageActions:
          hiringVerification.status === 'completed'
            ? { ...application.stageActions, verification: true }
            : application.stageActions,
      });
      if (!supabase) {
        setState((current) => ({
          ...current,
          applications: current.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      const current = state.applications.find((application) => application.id === appId);
      const stageActions =
        hiringVerification.status === 'completed'
          ? { ...current?.stageActions, verification: true }
          : current?.stageActions;
      const { error } = await supabase
        .from('applications')
        .update({
          hiring_verification: hiringVerification,
          ...(stageActions ? { stage_actions: stageActions } : {}),
        })
        .eq('id', appId);
      if (error) {
        setState((currentState) => ({
          ...currentState,
          applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
        }));
        return;
      }
      setState((currentState) => ({
        ...currentState,
        applications: currentState.applications.map((application) => (application.id === appId ? updateLocal(application) : application)),
      }));
    },
    markAttendance: async (jobId, workerId, date, present) => {
      if (!supabase) {
        setState((current) => {
          const existing = current.attendance.find((record) => record.jobId === jobId && record.workerId === workerId && record.date === date);
          return existing ? { ...current, attendance: current.attendance.map((record) => (record.id === existing.id ? { ...record, present } : record)) } : { ...current, attendance: [...current.attendance, { id: `att-${Date.now()}`, jobId, workerId, date, present }] };
        });
        return;
      }
      const { data: row, error } = await supabase.from('attendance').upsert({ job_id: jobId, worker_id: workerId, date, present }, { onConflict: 'job_id,worker_id,date' }).select('*').single();
      if (error) throw error;
      const attendance = toAttendance(row as Record<string, unknown>);
      setState((current) => ({ ...current, attendance: [...current.attendance.filter((item) => item.id !== attendance.id), attendance] }));
    },
    ensureChatSeeded: (appId) => {
      setState((current) => {
        if (current.messagesByAppId[appId]?.length) return current;
        const application = current.applications.find((item) => item.id === appId);
        const job = application ? current.jobs.find((item) => item.id === application.jobId) : undefined;
        const employerId = job?.employerId || 'employer';
        const workerId = application?.workerId || 'worker';
        const now = Date.now();
        const thread: ChatMessage[] = [
          {
            id: `msg-1-${appId}`,
            senderId: employerId,
            text: t('chatDemoMsg1'),
            at: now - 240000,
          },
          {
            id: `msg-2-${appId}`,
            senderId: workerId,
            text: t('chatDemoMsg2'),
            at: now - 180000,
          },
          {
            id: `msg-3-${appId}`,
            senderId: employerId,
            text: t('chatDemoMsg3'),
            at: now - 120000,
          },
          {
            id: `msg-4-${appId}`,
            senderId: employerId,
            text: t('chatDemoMsg4'),
            at: now - 60000,
          },
        ];
        return {
          ...current,
          messagesByAppId: { ...current.messagesByAppId, [appId]: thread },
        };
      });
    },
    sendMessage: (appId, text) => {
      const trimmed = text.trim();
      if (!trimmed || !state.session) return;
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: state.session.userId,
        text: trimmed,
        at: Date.now(),
      };
      setState((current) => {
        const existing = current.messagesByAppId[appId] || [];
        return {
          ...current,
          messagesByAppId: { ...current.messagesByAppId, [appId]: [...existing, message] },
        };
      });
    },
    getMessages: (appId) => state.messagesByAppId[appId] || [],
    getJob: (id) => state.jobs.find((job) => job.id === id),
    getApplicationsForJob: (jobId) => state.applications.filter((application) => application.jobId === jobId),
    getWorkerApplications: (workerId) => state.applications.filter((application) => application.workerId === workerId),
    getWorker: (id) => state.workers.find((worker) => worker.id === id),
    getAcceptedJobForWorker: (workerId) => {
      const application = state.applications.find(
        (item) => item.workerId === workerId && (item.status === 'accepted' || item.status === 'onboarding'),
      );
      return application ? state.jobs.find((job) => job.id === application.jobId) : undefined;
    },
    getHiredWorkersForEmployer: (employerId) => {
      const result: { job: Job; worker: WorkerProfile; app: Application }[] = [];
      for (const application of state.applications) {
        if (application.status !== 'accepted' && application.status !== 'onboarding') continue;
        const job = state.jobs.find((item) => item.id === application.jobId);
        if (!job || job.employerId !== employerId) continue;
        const worker = state.workers.find((item) => item.id === application.workerId);
        if (worker) result.push({ job, worker, app: application });
      }
      return result;
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
