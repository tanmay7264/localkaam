export type Language = 'en' | 'hi' | 'mr';

export type Role = 'worker' | 'employer';

export type AppStatus = 'pending' | 'accepted' | 'rejected';

export interface Job {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
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
}

export interface AttendanceRecord {
  id: string;
  jobId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
}

export type Screen =
  | 'language'
  | 'role'
  | 'login'
  | 'worker-home'
  | 'worker-job-details'
  | 'worker-applications'
  | 'worker-my-job'
  | 'worker-profile'
  | 'employer-home'
  | 'employer-create-job'
  | 'employer-applicants'
  | 'employer-candidate'
  | 'employer-attendance'
  | 'employer-profile';

export interface Session {
  role: Role;
  userId: string;
  name: string;
}
