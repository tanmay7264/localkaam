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
import type { Role, Screen } from '@/types';

interface SuccessState {
  title: string;
  message: string;
  onClose: () => void;
}

function AppContent() {
  const { session, logout, t, authReady, loading, error, clearError, refreshProfile } = useStore();
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-teal-700 font-semibold">{t('loading')}</div>;
  }

  // Onboarding flow
  if (!session) {
    if (screen === 'language') {
      return (
        <div className="app-shell">
          <LanguageScreen onContinue={() => setScreen('role')} />
        </div>
      );
    }
    if (screen === 'role') {
      return (
        <div className="app-shell">
          <RoleScreen
            onChoose={(role) => {
              setPendingRole(role);
              setScreen('login');
            }}
          />
        </div>
      );
    }
    if (screen === 'login' && pendingRole) {
      return (
        <div className="app-shell">
          <LoginScreen
            role={pendingRole}
            onDone={() => setScreen('verification')}
          />
        </div>
      );
    }
    return (
      <div className="app-shell">
        <LanguageScreen onContinue={() => setScreen('role')} />
      </div>
    );
  }

  if (session.verificationStatus !== 'verified' || !session.emailVerified) {
    return <VerificationScreen />;
  }

  // Logged in
  const isWorker = session.role === 'worker';

  const openJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setScreen(isWorker ? 'worker-job-details' : 'employer-candidate');
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
            onApplied={() =>
              setSuccess({
                title: t('applicationSubmitted'),
                message: t('applicationSubmittedMsg'),
                onClose: () => {
                  setSuccess(null);
                  setScreen('worker-applications');
                },
              })
            }
          />
        );
        break;
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
          />
        );
        break;
      case 'employer-candidate':
        content = (
          <EmployerCandidate
            appId={selectedAppId}
            onBack={() => setScreen('employer-applicants')}
          />
        );
        break;
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
    <div className="app-shell flex flex-col">
      <div className="flex-1">{content}</div>
      <BottomNav role={session.role} current={screen} onNavigate={navigate} />
      {error && (
        <button type="button" onClick={clearError} className="fixed top-4 left-4 right-4 z-40 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-left text-sm text-red-700 shadow-lg" role="alert">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-teal-700 text-white py-4 text-lg font-semibold active:bg-teal-800"
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
