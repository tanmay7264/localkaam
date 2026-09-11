import type { Job, Application, WorkerProfile, AttendanceRecord } from './types';

export const DEMO_FALLBACK_PHONE = '+919876543210';

export const seedJobs: Job[] = [
  {
    id: 'job-sales-assistant',
    title: 'Sales Assistant',
    employerId: 'emp-1',
    employerName: 'Sharma Electronics',
    employerPhone: '+919820011001',
    location: 'FC Road, Pune',
    salary: 15000,
    workingHours: '9:00 AM - 6:00 PM',
    skills: ['Basic English', 'Cash Handling', 'Customer Service'],
    workersNeeded: 2,
    distanceKm: 1.5,
    published: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'job-delivery-boy',
    title: 'Delivery Boy',
    employerId: 'emp-2',
    employerName: 'QuickMart',
    employerPhone: '+919820022002',
    location: 'Kothrud, Pune',
    salary: 12000,
    workingHours: '8:00 AM - 5:00 PM',
    skills: ['Driving', 'Smartphone Use', 'Time Management'],
    workersNeeded: 3,
    distanceKm: 3.2,
    published: true,
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'job-cook-helper',
    title: 'Cook Helper',
    employerId: 'emp-3',
    employerName: 'Hotel Maharaj',
    employerPhone: '+919820033003',
    location: 'Camp, Pune',
    salary: 10000,
    workingHours: '10:00 AM - 9:00 PM',
    skills: ['Cooking Basics', 'Hygiene'],
    workersNeeded: 1,
    distanceKm: 2.0,
    published: true,
    createdAt: Date.now() - 259200000,
  },
  {
    id: 'job-security-guard',
    title: 'Security Guard',
    employerId: 'emp-4',
    employerName: 'SafeGuard Services',
    employerPhone: '+919820044004',
    location: 'Hinjewadi, Pune',
    salary: 14000,
    workingHours: '6:00 PM - 6:00 AM',
    skills: ['Physical Fitness', 'Alertness'],
    workersNeeded: 4,
    distanceKm: 5.5,
    published: true,
    createdAt: Date.now() - 345600000,
  },
];

export const seedWorkers: WorkerProfile[] = [
  {
    id: 'worker-demo',
    name: 'Ramesh Patil',
    skills: ['Basic English', 'Cash Handling', 'Customer Service'],
    experienceYears: 2,
    distanceKm: 1.5,
    verified: true,
  },
  {
    id: 'worker-2',
    name: 'Suresh Kumar',
    skills: ['Driving', 'Smartphone Use'],
    experienceYears: 3,
    distanceKm: 2.8,
    verified: false,
  },
  {
    id: 'worker-3',
    name: 'Anil Deshmukh',
    skills: ['Cooking Basics', 'Hygiene', 'Customer Service'],
    experienceYears: 1,
    distanceKm: 1.2,
    verified: true,
  },
];

export const seedApplications: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-sales-assistant',
    workerId: 'worker-3',
    workerName: 'Anil Deshmukh',
    status: 'applied',
    appliedAt: Date.now() - 3600000,
    peakStage: 'applied',
    stageActions: {},
  },
  {
    id: 'app-2',
    jobId: 'job-delivery-boy',
    workerId: 'worker-2',
    workerName: 'Priya More',
    status: 'shortlisted',
    appliedAt: Date.now() - 86400000,
    peakStage: 'shortlisted',
    stageActions: {},
  },
];

export const seedAttendance: AttendanceRecord[] = [];

export const employerNames: Record<string, string> = {
  'emp-1': 'Sharma Electronics',
  'emp-2': 'QuickMart',
  'emp-3': 'Hotel Maharaj',
  'emp-4': 'SafeGuard Services',
};

export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}
