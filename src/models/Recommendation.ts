import mongoose, { Document, Schema } from 'mongoose';
import { 
  TRecommendationStatus, 
  TSubmissionMethod,
  RECOMMENDATION_STATUSES,
  SUBMISSION_METHODS
} from '../types/application.types.js';

export interface IRecommendation extends Document {
  recommender: mongoose.Types.ObjectId;
  status: TRecommendationStatus;
  submissionMethod: TSubmissionMethod;
  requestDate: Date;
  dueDate: Date;
  submissionDate?: Date;
}

const RecommendationSchema: Schema = new Schema({
  recommender: {
    type: Schema.Types.ObjectId,
    ref: 'Recommender',
    required: true
  },
  status: {
    type: String,
    enum: RECOMMENDATION_STATUSES,
    default: 'Pending'
  },
  submissionMethod: {
    type: String,
    enum: SUBMISSION_METHODS,
    required: true
  },
  requestDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  submissionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema); 