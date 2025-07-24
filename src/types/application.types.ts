import { IRecommendation } from './recommendation.types.js';
import { IEssay } from './essay.types.js';

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

// Original Application interface (converted to snake_case for MySQL)
export interface IApplication {
  application_id?: number;
  student_id: string;
  scholarship_name: string;
  target_type: TTargetType;
  organization: string;
  org_website: string;
  platform: string;
  application_link: string;
  theme: string;
  amount: number;
  requirements: string;
  renewable: boolean;
  renewable_terms?: string;
  document_info_link: string;
  current_action: string;
  status: TApplicationStatus;
  submission_date?: Date;
  open_date: Date;
  due_date: Date;
  created_at?: Date;
  updated_at?: Date;
  recommendations?: IRecommendation[];
  essays?: IEssay[];
}
