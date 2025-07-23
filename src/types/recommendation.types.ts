import { 
  TRecommendationStatus, 
  TSubmissionMethod,
  RECOMMENDATION_STATUSES,
  SUBMISSION_METHODS
} from './application.types.js';

export interface Recommendation {
  recommendation_id?: number;
  application_id: number;
  recommender_id: number;
  content?: string;
  submitted_at?: Date;
  status: 'pending' | 'submitted' | 'declined';
  created_at?: Date;
  updated_at?: Date;
}

// Legacy interface for backward compatibility
export interface IRecommendation {
  recommendation_id?: number;
  application_id: number;
  recommender_id: number;
  content?: string;
  submitted_at?: Date;
  status: TRecommendationStatus;
  created_at?: Date;
  updated_at?: Date;
} 