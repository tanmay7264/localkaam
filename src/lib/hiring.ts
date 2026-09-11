import type {
  AppStatus,
  Application,
  CheckItemStatus,
  HiringVerification,
  HiringVerificationItemKey,
  PipelinePeakStage,
  Role,
} from '../types';

/** Tracker UI steps (final_decision is visual-only for accept/reject). */
export const HIRING_STEPS = [
  'applied',
  'under_review',
  'shortlisted',
  'employee_chat',
  'schedule_interview',
  'interview',
  'verification',
  'final_decision',
  'onboarding',
] as const;

export type HiringStep = (typeof HIRING_STEPS)[number];

/** Ordered statuses employers advance through before hire. */
export const PIPELINE_STATUSES: AppStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'employee_chat',
  'schedule_interview',
  'interview',
  'verification',
];

const ALL_STATUSES: AppStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'employee_chat',
  'schedule_interview',
  'interview',
  'verification',
  'accepted',
  'rejected',
  'onboarding',
];

export function normalizeAppStatus(status: string): AppStatus {
  if (status === 'pending') return 'applied';
  return ALL_STATUSES.includes(status as AppStatus) ? (status as AppStatus) : 'applied';
}

/** Rejected ends the journey; accepted can still advance to onboarding. */
export function isTerminalStatus(status: AppStatus): boolean {
  return status === 'rejected' || status === 'onboarding';
}

export function canReject(status: AppStatus): boolean {
  return status !== 'rejected' && status !== 'onboarding' && status !== 'accepted';
}

export function peakStageFor(status: AppStatus, peakStage?: PipelinePeakStage): PipelinePeakStage {
  if (status === 'accepted' || status === 'rejected') return peakStage || 'applied';
  if (status === 'onboarding') return 'onboarding';
  return status;
}

export function getHiringStepIndex(
  status: AppStatus,
  _peakStage?: PipelinePeakStage,
  options?: { verificationDone?: boolean },
): number {
  if (status === 'rejected') return HIRING_STEPS.indexOf('final_decision');
  if (status === 'accepted') return HIRING_STEPS.indexOf('onboarding');
  if (status === 'onboarding') return HIRING_STEPS.indexOf('onboarding');
  if (status === 'verification' && options?.verificationDone) {
    return HIRING_STEPS.indexOf('final_decision');
  }
  const index = HIRING_STEPS.indexOf(status as HiringStep);
  return index >= 0 ? index : 0;
}

export function getCompletedThroughIndex(
  status: AppStatus,
  peakStage?: PipelinePeakStage,
  options?: { verificationDone?: boolean },
): number {
  if (status === 'onboarding' || status === 'accepted') {
    return HIRING_STEPS.indexOf('final_decision');
  }
  if (status === 'rejected') {
    const peak = peakStageFor(status, peakStage);
    const peakIndex = HIRING_STEPS.indexOf(peak as HiringStep);
    return peakIndex >= 0 ? peakIndex : 0;
  }
  if (status === 'verification' && options?.verificationDone) {
    return HIRING_STEPS.indexOf('verification');
  }
  return getHiringStepIndex(status, peakStage, options);
}

/**
 * Next status when employer advances.
 * verification → accepted (hire); accepted → onboarding; onboarding → null.
 */
export function getNextPipelineStatus(status: AppStatus): AppStatus | null {
  if (status === 'rejected' || status === 'onboarding') return null;
  if (status === 'accepted') return 'onboarding';
  if (status === 'verification') return null; // hire action sets accepted
  const index = PIPELINE_STATUSES.indexOf(status);
  if (index < 0) return 'under_review';
  if (index >= PIPELINE_STATUSES.length - 1) return null;
  return PIPELINE_STATUSES[index + 1];
}

export function statusLabelKey(status: AppStatus): string {
  switch (status) {
    case 'applied':
      return 'stageApplied';
    case 'under_review':
      return 'stageUnderReview';
    case 'shortlisted':
      return 'stageShortlisted';
    case 'employee_chat':
      return 'stageEmployeeChat';
    case 'schedule_interview':
      return 'stageScheduleInterview';
    case 'interview':
      return 'stageInterviewScheduled';
    case 'verification':
      return 'stageThirdPartyVerification';
    case 'accepted':
      return 'accepted';
    case 'rejected':
      return 'rejected';
    case 'onboarding':
      return 'stageOnboarding';
    default:
      return 'stageApplied';
  }
}

export function hiringStepLabelKey(step: HiringStep): string {
  switch (step) {
    case 'applied':
      return 'stageApplied';
    case 'under_review':
      return 'stageUnderReview';
    case 'shortlisted':
      return 'stageShortlisted';
    case 'employee_chat':
      return 'stageEmployeeChat';
    case 'schedule_interview':
      return 'stageScheduleInterview';
    case 'interview':
      return 'stageInterviewScheduled';
    case 'verification':
      return 'stageThirdPartyVerification';
    case 'final_decision':
      return 'stageFinalDecision';
    case 'onboarding':
      return 'stageOnboarding';
    default:
      return 'stageApplied';
  }
}

export function advanceActionLabelKey(status: AppStatus): string {
  if (status === 'verification') return 'hireWorkerAction';
  if (status === 'accepted') return 'advanceToOnboarding';
  const next = getNextPipelineStatus(status);
  if (!next) return 'hireWorkerAction';
  switch (next) {
    case 'under_review':
      return 'advanceToUnderReview';
    case 'shortlisted':
      return 'advanceToShortlisted';
    case 'employee_chat':
      return 'advanceToEmployeeChat';
    case 'schedule_interview':
      return 'advanceToScheduleInterview';
    case 'interview':
      return 'advanceToInterview';
    case 'verification':
      return 'advanceToVerification';
    case 'onboarding':
      return 'advanceToOnboarding';
    default:
      return 'advanceStage';
  }
}

export function outcomeBannerKey(status: AppStatus): string {
  if (status === 'accepted' || status === 'onboarding') return 'youreHired';
  if (status === 'rejected') return 'applicationRejected';
  if (status === 'applied') return 'alreadyApplied';
  return 'applicationInProgress';
}

/** Stage keys that show a prototype CTA when current. */
export type JourneyCtaStage =
  | 'under_review'
  | 'shortlisted'
  | 'employee_chat'
  | 'schedule_interview'
  | 'interview'
  | 'verification'
  | 'onboarding';

export function journeyCtaLabelKey(stage: JourneyCtaStage, role: Role): string {
  if (stage === 'interview') return 'ctaInterviewCompleted';
  if (stage === 'verification') return 'ctaStartVerification';
  if (stage === 'under_review') return 'ctaContinueShortlist';
  if (role === 'worker') {
    switch (stage) {
      case 'shortlisted':
        return 'chatWithEmployee';
      case 'employee_chat':
        return 'arrangeInterview';
      case 'schedule_interview':
        return 'arrangeInterview';
      case 'onboarding':
        return 'ctaBeginOnboarding';
    }
  }
  switch (stage) {
    case 'shortlisted':
      return 'ctaMessageCandidate';
    case 'employee_chat':
      return 'arrangeInterview';
    case 'schedule_interview':
      return 'arrangeInterview';
    case 'onboarding':
      return 'ctaStartOnboarding';
  }
}

export function journeyCtaConfirmKey(stage: JourneyCtaStage): string {
  switch (stage) {
    case 'under_review':
      return 'ctaConfirmShortlist';
    case 'shortlisted':
    case 'employee_chat':
      return 'ctaConfirmChat';
    case 'schedule_interview':
      return 'ctaConfirmSchedule';
    case 'interview':
      return 'ctaConfirmInterviewCompleted';
    case 'verification':
      return 'ctaConfirmVerification';
    case 'onboarding':
      return 'ctaConfirmOnboarding';
  }
}

export function isJourneyCtaStage(status: AppStatus): status is JourneyCtaStage {
  return (
    status === 'under_review' ||
    status === 'shortlisted' ||
    status === 'employee_chat' ||
    status === 'schedule_interview' ||
    status === 'interview' ||
    status === 'verification' ||
    status === 'onboarding'
  );
}

/** Ordered third-party checks shown on the hiring verification screen. */
export const HIRING_VERIFICATION_ITEMS = ['identity', 'contact', 'employment', 'documents'] as const;

export function createInitialHiringVerification(): HiringVerification {
  return {
    status: 'required',
    items: {
      identity: 'pending',
      contact: 'pending',
      employment: 'pending',
      documents: 'pending',
    },
  };
}

export function hiringVerificationItemLabelKey(key: HiringVerificationItemKey): string {
  switch (key) {
    case 'identity':
      return 'verifyItemIdentity';
    case 'contact':
      return 'verifyItemContact';
    case 'employment':
      return 'verifyItemEmployment';
    case 'documents':
      return 'verifyItemDocuments';
  }
}

export function checkItemStatusLabelKey(status: CheckItemStatus): string {
  switch (status) {
    case 'completed':
      return 'verifyStatusCompleted';
    case 'in_progress':
      return 'verifyStatusInProgress';
    case 'pending':
      return 'verifyStatusPending';
  }
}

/** Demo time slots for schedule interview prototype. */
export const DEMO_INTERVIEW_SLOTS = ['Tomorrow 10:00 AM', 'Tomorrow 2:00 PM', 'Day after 11:00 AM'];

/** Simplified recruiter dashboard stages. */
export const RECRUITER_STAGES = [
  'applied',
  'review',
  'shortlisted',
  'chat',
  'interview',
  'verification',
  'decision',
] as const;

export type RecruiterStage = (typeof RECRUITER_STAGES)[number];

export type RecruiterAction =
  | 'shortlist'
  | 'chat'
  | 'arrange_interview'
  | 'mark_interview_done'
  | 'initiate_verification'
  | 'view_verification'
  | 'final_decision';

export function isVerificationComplete(application: Application): boolean {
  return application.hiringVerification?.status === 'completed' || Boolean(application.stageActions?.verification);
}

export function recruiterStageFor(application: Application): RecruiterStage {
  const { status } = application;
  if (status === 'accepted' || status === 'onboarding' || status === 'rejected') return 'decision';
  if (status === 'verification' && isVerificationComplete(application)) return 'decision';
  if (status === 'verification') return 'verification';
  if (status === 'interview' || status === 'schedule_interview') return 'interview';
  if (status === 'employee_chat') return 'chat';
  if (status === 'shortlisted') return 'shortlisted';
  if (status === 'under_review') return 'review';
  return 'applied';
}

export function recruiterStageLabelKey(stage: RecruiterStage): string {
  switch (stage) {
    case 'applied':
      return 'recruiterStageApplied';
    case 'review':
      return 'recruiterStageReview';
    case 'shortlisted':
      return 'recruiterStageShortlisted';
    case 'chat':
      return 'recruiterStageChat';
    case 'interview':
      return 'recruiterStageInterview';
    case 'verification':
      return 'recruiterStageVerification';
    case 'decision':
      return 'recruiterStageDecision';
  }
}

export function recruiterActionLabelKey(action: RecruiterAction): string {
  switch (action) {
    case 'shortlist':
      return 'recruiterShortlist';
    case 'chat':
      return 'recruiterChat';
    case 'arrange_interview':
      return 'recruiterArrangeInterview';
    case 'mark_interview_done':
      return 'recruiterMarkInterviewDone';
    case 'initiate_verification':
      return 'recruiterInitiateVerification';
    case 'view_verification':
      return 'recruiterViewVerification';
    case 'final_decision':
      return 'recruiterMakeDecision';
  }
}

/** Prototype actions available for the recruiter on this application. */
export function recruiterActionsFor(application: Application): RecruiterAction[] {
  const { status } = application;

  if (status === 'rejected') return [];
  if (status === 'accepted' || status === 'onboarding') {
    return isVerificationComplete(application) ? ['view_verification'] : [];
  }

  const actions: RecruiterAction[] = [];

  if (status === 'applied' || status === 'under_review') {
    actions.push('shortlist');
  }

  if (status === 'shortlisted' || status === 'employee_chat') {
    actions.push('chat');
  }

  if (status === 'shortlisted' || status === 'employee_chat' || status === 'schedule_interview') {
    actions.push('arrange_interview');
  }

  if (status === 'interview') {
    actions.push('mark_interview_done');
  }

  if (status === 'verification') {
    if (isVerificationComplete(application)) {
      actions.push('view_verification', 'final_decision');
    } else if (application.hiringVerification?.status === 'in_progress') {
      actions.push('view_verification');
    } else {
      actions.push('initiate_verification');
    }
  }

  return actions;
}

export function primaryRecruiterAction(application: Application): RecruiterAction | null {
  return recruiterActionsFor(application)[0] || null;
}
