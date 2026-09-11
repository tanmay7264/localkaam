import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from '@/store';
import { BottomNav } from '@/components/BottomNav';
import { LanguageScreen, RoleScreen, LoginScreen, VerificationScreen } from '@/screens/Onboarding';
import {
  WorkerHome,
  WorkerJobDetails,
  WorkerApplications,
  WorkerMyJob,
  WorkerProfile,
} from '@/screens/Worker';
import {
  EmployerHome,
  EmployerCreateJob,
  EmployerApplicants,
  EmployerCandidate,
  EmployerAttendance,
  EmployerProfile,
} from '@/screens/Employer';
import { EmployeeChatScreen } from '@/screens/Chat';
import { InterviewSchedulingScreen } from '@/screens/InterviewScheduling';
import { HiringVerificationScreen } from '@/screens/HiringVerification';
import type { Role, Screen } from '@/types';

interface SuccessState {
  title: string;
  message: string;
  onClose: () => void;
}

function AppContent() {
  const { session, logout, t, authReady, loading, error, clearError, refreshProfile, applications } = useStore();
  const [screen, setScreen] = useState<Screen>('language');
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    const verificationResult = new URLSearchParams(window.location.search).get('verification');
    if (verificationResult) {
      window.history.replaceState({}, '', window.location.pathname);
      void refreshProfile();
    }
  }, [refreshProfile]);

  const handleLogout = () => {
    void logout();
    setScreen('language');
    setPendingRole(null);
  };

  if (!authReady || loading) {
    return <div className="app-shell items-center justify-center text-teal-800 font-semibold">{t('loading')}</div>;
  }

  // Onboarding flow
  if (!session) {
    if (screen === 'language') {
      return (
        <div className="app-shell">
          <div className="app-shell-scroll">
            <LanguageScreen onContinue={() => setScreen('role')} />
          </div>
        </div>
      );
    }
    if (screen === 'role') {
      return (
        <div className="app-shell">
          <div className="app-shell-scroll">
            <RoleScreen
              onChoose={(role) => {
                setPendingRole(role);
                setScreen('login');
              }}
            />
          </div>
        </div>
      );
    }
    if (screen === 'login' && pendingRole) {
      return (
        <div className="app-shell">
          <div className="app-shell-scroll">
            <LoginScreen
              role={pendingRole}
              onDone={() => setScreen('verification')}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="app-shell">
        <div className="app-shell-scroll">
          <LanguageScreen onContinue={() => setScreen('role')} />
        </div>
      </div>
    );
  }

  if (session.verificationStatus !== 'verified' || !session.emailVerified) {
    return (
      <div className="app-shell">
        <div className="app-shell-scroll">
          <VerificationScreen />
        </div>
      </div>
    );
  }

  // Logged in
  const isWorker = session.role === 'worker';

  const openJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setScreen(isWorker ? 'worker-job-details' : 'employer-candidate');
  };

  const openWorkerChat = (appId: string) => {
    setSelectedAppId(appId);
    const application = applications.find((item) => item.id === appId);
    if (application) setSelectedJobId(application.jobId);
    setScreen('worker-chat');
  };

  const openEmployerChat = (appId: string) => {
    setSelectedAppId(appId);
    setScreen('employer-chat');
  };

  const navigate = (key: string) => setScreen(key as Screen);

  let content: React.ReactNode = null;

  if (isWorker) {
    switch (screen) {
      case 'worker-home':
        content = <WorkerHome onOpenJob={openJob} />;
        break;
      case 'worker-job-details':
        content = (
          <WorkerJobDetails
            jobId={selectedJobId}
            onBack={() => setScreen('worker-home')}
            onOpenChat={openWorkerChat}
            onArrangeInterview={(appId) => {
              setSelectedAppId(appId);
              const application = applications.find((item) => item.id === appId);
              if (application) setSelectedJobId(application.jobId);
              setScreen('worker-schedule-interview');
            }}
            onOpenVerification={(appId) => {
              setSelectedAppId(appId);
              const application = applications.find((item) => item.id === appId);
              if (application) setSelectedJobId(application.jobId);
              setScreen('worker-hiring-verification');
            }}
            onApplied={() =>
              setSuccess({
                title: t('applicationSubmitted'),
                message: t('applicationSubmittedMsg'),
                onClose: () => {
                  setSuccess(null);
                  setScreen('worker-job-details');
                },
              })
            }
          />
        );
        break;
      case 'worker-chat': {
        content = (
          <EmployeeChatScreen
            appId={selectedAppId}
            role="worker"
            onBack={() => setScreen('worker-job-details')}
            onArrangeInterview={() => setScreen('worker-schedule-interview')}
          />
        );
        break;
      }
      case 'worker-schedule-interview': {
        content = (
          <InterviewSchedulingScreen
            appId={selectedAppId}
            role="worker"
            onBack={() => setScreen('worker-job-details')}
          />
        );
        break;
      }
      case 'worker-hiring-verification': {
        content = (
          <HiringVerificationScreen
            appId={selectedAppId}
            role="worker"
            onBack={() => setScreen('worker-job-details')}
          />
        );
        break;
      }
      case 'worker-applications':
        content = <WorkerApplications onOpenJob={openJob} />;
        break;
      case 'worker-my-job':
        content = <WorkerMyJob onOpenJob={openJob} />;
        break;
      case 'worker-profile':
        content = <WorkerProfile onLogout={handleLogout} />;
        break;
      default:
        content = <WorkerHome onOpenJob={openJob} />;
    }
  } else {
    switch (screen) {
      case 'employer-home':
        content = (
          <EmployerHome
            onCreateJob={() => setScreen('employer-create-job')}
            onOpenJob={openJob}
          />
        );
        break;
      case 'employer-create-job':
        content = (
          <EmployerCreateJob
            onBack={() => setScreen('employer-home')}
            onPublished={() =>
              setSuccess({
                title: t('jobPublished'),
                message: t('jobPublishedMsg'),
                onClose: () => {
                  setSuccess(null);
                  setScreen('employer-home');
                },
              })
            }
          />
        );
        break;
      case 'employer-applicants':
        content = (
          <EmployerApplicants
            onOpenApplicant={(appId) => {
              setSelectedAppId(appId);
              setScreen('employer-candidate');
            }}
            onOpenChat={openEmployerChat}
            onArrangeInterview={(appId) => {
              setSelectedAppId(appId);
              setScreen('employer-schedule-interview');
            }}
            onOpenVerification={(appId) => {
              setSelectedAppId(appId);
              setScreen('employer-hiring-verification');
            }}
          />
        );
        break;
      case 'employer-candidate':
        content = (
          <EmployerCandidate
            appId={selectedAppId}
            onBack={() => setScreen('employer-applicants')}
            onOpenChat={openEmployerChat}
            onArrangeInterview={(appId) => {
              setSelectedAppId(appId);
              setScreen('employer-schedule-interview');
            }}
            onOpenVerification={(appId) => {
              setSelectedAppId(appId);
              setScreen('employer-hiring-verification');
            }}
          />
        );
        break;
      case 'employer-chat': {
        content = (
          <EmployeeChatScreen
            appId={selectedAppId}
            role="employer"
            onBack={() => setScreen('employer-candidate')}
            onArrangeInterview={() => setScreen('employer-schedule-interview')}
          />
        );
        break;
      }
      case 'employer-schedule-interview': {
        content = (
          <InterviewSchedulingScreen
            appId={selectedAppId}
            role="employer"
            onBack={() => setScreen('employer-candidate')}
          />
        );
        break;
      }
      case 'employer-hiring-verification': {
        content = (
          <HiringVerificationScreen
            appId={selectedAppId}
            role="employer"
            onBack={() => setScreen('employer-candidate')}
          />
        );
        break;
      }
      case 'employer-attendance':
        content = <EmployerAttendance />;
        break;
      case 'employer-profile':
        content = <EmployerProfile onLogout={handleLogout} />;
        break;
      default:
        content = (
          <EmployerHome
            onCreateJob={() => setScreen('employer-create-job')}
            onOpenJob={openJob}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <div className="app-shell-scroll">{content}</div>
      <BottomNav role={session.role} current={screen} onNavigate={navigate} />
      {error && (
        <button
          type="button"
          onClick={clearError}
          className="absolute top-4 left-4 right-4 z-40 rounded-xl bg-red-50 border border-red-300 px-4 py-3 text-left text-sm text-red-800 shadow-lg"
          role="alert"
        >
          {error}
        </button>
      )}
      {success && (
        <SuccessOverlay
          title={success.title}
          message={success.message}
          onClose={success.onClose}
        />
      )}
    </div>
  );
}

function SuccessOverlay({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-6" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-pop shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-teal-800 text-white py-4 text-lg font-semibold active:bg-teal-900"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
