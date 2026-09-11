export type Language = 'en' | 'hi' | 'mr';

export type Role = 'worker' | 'employer';

export type AppStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'employee_chat'
  | 'schedule_interview'
  | 'interview'
  | 'verification'
  | 'accepted'
  | 'rejected'
  | 'onboarding';

export type PipelinePeakStage = Exclude<AppStatus, 'accepted' | 'rejected'>;

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'needs_review' | 'rejected' | 'expired';

export interface Job {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  employerPhone?: string;
  location: string;
  salary: number;
  workingHours: string;
  skills: string[];
  workersNeeded: number;
  distanceKm: number;
  published: boolean;
  createdAt: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  skills: string[];
  experienceYears: number;
  distanceKm: number;
  verified: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  status: AppStatus;
  appliedAt: number;
  /** Furthest pipeline stage reached (for progress UI after reject/accept). */
  peakStage?: PipelinePeakStage;
  /** Prototype CTAs completed per stage key. */
  stageActions?: Partial<Record<string, boolean>>;
  interview?: InterviewDetails;
  /** Prototype third-party background checks for the hiring pipeline. */
  hiringVerification?: HiringVerification;
}

export type InterviewType = 'online' | 'in_person';

export interface InterviewDetails {
  type: InterviewType;
  date: string;
  time: string;
  interviewerName: string;
  locationOrLink: string;
  scheduledAt: number;
}

export type CheckItemStatus = 'pending' | 'in_progress' | 'completed';

export type HiringVerificationItemKey = 'identity' | 'contact' | 'employment' | 'documents';

export interface HiringVerification {
  status: 'required' | 'in_progress' | 'completed';
  items: Record<HiringVerificationItemKey, CheckItemStatus>;
  startedAt?: number;
  completedAt?: number;
}

export interface AttendanceRecord {
  id: string;
  jobId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  at: number;
}

export type Screen =
  | 'language'
  | 'role'
  | 'login'
  | 'verification'
  | 'worker-home'
  | 'worker-job-details'
  | 'worker-applications'
  | 'worker-my-job'
  | 'worker-profile'
  | 'worker-chat'
  | 'worker-schedule-interview'
  | 'worker-hiring-verification'
  | 'employer-home'
  | 'employer-create-job'
  | 'employer-applicants'
  | 'employer-candidate'
  | 'employer-attendance'
  | 'employer-profile'
  | 'employer-chat'
  | 'employer-schedule-interview'
  | 'employer-hiring-verification';

export interface Session {
  role: Role;
  userId: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  verificationStatus: VerificationStatus;
}
