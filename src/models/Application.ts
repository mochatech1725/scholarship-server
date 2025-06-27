import mongoose, { Document, Schema } from 'mongoose';
import Essay, { IEssay } from './Essay.js';
import Recommender, { IRecommender } from './Recommender.js';
import Recommendation, { IRecommendation } from './Recommendation.js';
import { 
  TApplicationStatus, 
  TTargetType, 
  APPLICATION_STATUSES,
  TARGET_TYPES
} from '../types/application.types.js';

export interface IApplication extends Document {
  studentId: string;
  scholarshipName: string;
  targetType: TTargetType;
  company: string;
  companyWebsite: string;
  platform: string;
  applicationLink: string;
  theme: string;
  amount: number;
  requirements: string;
  renewable: boolean;
  renewableTerms?: string;
  documentInfoLink: string;
  currentAction: string;
  status: TApplicationStatus;
  essays: IEssay[]; // Array of embedded Essay objects
  recommendations: IRecommendation[]; // Array of embedded Recommendation objects
  submissionDate: Date;
  openDate: Date;
  dueDate: Date;
}

const ApplicationSchema: Schema = new Schema({
  studentId: {
    type: String,
    required: true
  },
  scholarshipName: {
    type: String,
    required: true,
    trim: true
  },
  targetType: {
    type: String,
    enum: TARGET_TYPES
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  companyWebsite: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    trim: true
  },
  applicationLink: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
  },
  requirements: {
    type: String,
    trim: true
  },
  renewable: {
    type: Boolean,
    default: false
  },
  renewableTerms: {
    type: String,
    trim: true
  },
  documentInfoLink: {
    type: String,
    trim: true
  },
  currentAction: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: 'Not Started'
  },
  essays: [Essay.schema],
  recommendations: [Recommendation.schema],
  submissionDate: {
    type: Date
  },
  openDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IApplication>('Application', ApplicationSchema); 