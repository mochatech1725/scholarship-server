// Define the constants first (single source of truth)
export const APPLICATION_STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Awarded', 'Not Awarded'] as const;
export const TARGET_TYPES = ['Merit', 'Need', 'Both'] as const;
export const RECOMMENDATION_STATUSES = ['Pending', 'Submitted'] as const;
export const SUBMISSION_METHODS = ['DirectEmail', 'StudentUpload', 'DirectMail'] as const;

// Derive types from constants to eliminate duplication
export type TApplicationStatus = typeof APPLICATION_STATUSES[number];
export type TTargetType = typeof TARGET_TYPES[number];
export type TRecommendationStatus = typeof RECOMMENDATION_STATUSES[number];
export type TSubmissionMethod = typeof SUBMISSION_METHODS[number];
