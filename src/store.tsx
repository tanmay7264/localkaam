import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language, Role, Session, Job, Application, WorkerProfile, AttendanceRecord, AppStatus } from './types';
import { makeT } from './i18n';
import { seedJobs, seedApplications, seedWorkers, seedAttendance } from './seed';

interface StoreState {
  language: Language;
  session: Session | null;
  jobs: Job[];
  applications: Application[];
  workers: WorkerProfile[];
  attendance: AttendanceRecord[];
}

interface StoreContextValue extends StoreState {
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  login: (role: Role, name: string) => void;
  logout: () => void;
  createJob: (data: Omit<Job, 'id' | 'employerId' | 'employerName' | 'published' | 'createdAt' | 'distanceKm'>) => void;
  applyToJob: (jobId: string) => void;
  setApplicationStatus: (appId: string, status: AppStatus) => void;
  markAttendance: (jobId: string, workerId: string, date: string, present: boolean) => void;
  getJob: (id: string) => Job | undefined;
  getApplicationsForJob: (jobId: string) => Application[];
  getWorkerApplications: (workerId: string) => Application[];
  getWorker: (id: string) => WorkerProfile | undefined;
  getAcceptedJobForWorker: (workerId: string) => Job | undefined;
  getHiredWorkersForEmployer: (employerId: string) => { job: Job; worker: WorkerProfile; app: Application }[];
}

const STORAGE_KEY = 'local-kaam-state-v1';

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        language: parsed.language || 'en',
        session: parsed.session || null,
        jobs: parsed.jobs?.length ? parsed.jobs : seedJobs,
        applications: parsed.applications || seedApplications,
        workers: parsed.workers?.length ? parsed.workers : seedWorkers,
        attendance: parsed.attendance || seedAttendance,
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
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const t = makeT(state.language);

  const value: StoreContextValue = {
    ...state,
    t,
    setLanguage: (lang) => setState((s) => ({ ...s, language: lang })),
    login: (role, name) => {
      const userId = role === 'worker' ? 'worker-demo' : 'emp-1';
      setState((s) => ({ ...s, session: { role, userId, name } }));
    },
    logout: () => setState((s) => ({ ...s, session: null })),
    createJob: (data) =>
      setState((s) => {
        const job: Job = {
          ...data,
          id: `job-${Date.now()}`,
          employerId: s.session?.userId || 'emp-1',
          employerName: s.session?.name || 'My Business',
          distanceKm: 0,
          published: true,
          createdAt: Date.now(),
        };
        return { ...s, jobs: [job, ...s.jobs] };
      }),
    applyToJob: (jobId) =>
      setState((s) => {
        if (!s.session) return s;
        const existing = s.applications.find((a) => a.jobId === jobId && a.workerId === s.session!.userId);
        if (existing) return s;
        const app: Application = {
          id: `app-${Date.now()}`,
          jobId,
          workerId: s.session.userId,
          workerName: s.session.name,
          status: 'pending',
          appliedAt: Date.now(),
        };
        return { ...s, applications: [app, ...s.applications] };
      }),
    setApplicationStatus: (appId, status) =>
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) => (a.id === appId ? { ...a, status } : a)),
      })),
    markAttendance: (jobId, workerId, date, present) =>
      setState((s) => {
        const existing = s.attendance.find((a) => a.jobId === jobId && a.workerId === workerId && a.date === date);
        if (existing) {
          return {
            ...s,
            attendance: s.attendance.map((a) =>
              a.id === existing.id ? { ...a, present } : a,
            ),
          };
        }
        const record: AttendanceRecord = {
          id: `att-${Date.now()}`,
          jobId,
          workerId,
          date,
          present,
        };
        return { ...s, attendance: [...s.attendance, record] };
      }),
    getJob: (id) => state.jobs.find((j) => j.id === id),
    getApplicationsForJob: (jobId) => state.applications.filter((a) => a.jobId === jobId),
    getWorkerApplications: (workerId) => state.applications.filter((a) => a.workerId === workerId),
    getWorker: (id) => state.workers.find((w) => w.id === id),
    getAcceptedJobForWorker: (workerId) => {
      const app = state.applications.find((a) => a.workerId === workerId && a.status === 'accepted');
      return app ? state.jobs.find((j) => j.id === app.jobId) : undefined;
    },
    getHiredWorkersForEmployer: (employerId) => {
      const result: { job: Job; worker: WorkerProfile; app: Application }[] = [];
      for (const app of state.applications) {
        if (app.status !== 'accepted') continue;
        const job = state.jobs.find((j) => j.id === app.jobId);
        if (!job || job.employerId !== employerId) continue;
        const worker = state.workers.find((w) => w.id === app.workerId);
        if (worker) result.push({ job, worker, app });
      }
      return result;
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
