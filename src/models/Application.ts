import mongoose, { Document, Schema } from 'mongoose';
import Essay from './Essay.js';
import Recommender from './Recommender.js';
import { 
  TApplicationStatus, 
  TTargetType, 
  APPLICATION_STATUSES,
  TARGET_TYPES,
  RECOMMENDATION_STATUSES,
  SUBMISSION_METHODS
} from '../types/application.types.js';

const EmbeddedEssaySchema = new Schema(Essay.schema.obj, { 
  _id: false,
  timestamps: false 
});

const EmbeddedRecommenderSchema = new Schema(Recommender.schema.obj, { 
  _id: false,
  timestamps: false 
});

// Create embedded Recommendation schema with embedded Recommender
const EmbeddedRecommendationSchema = new Schema({
  recommender: {
    type: EmbeddedRecommenderSchema,
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
  _id: false,
  timestamps: false 
});

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
  essays: any[]; // Array of embedded Essay objects
  recommendations: any[]; // Array of embedded Recommendation objects
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
  essays: [EmbeddedEssaySchema],
  recommendations: [EmbeddedRecommendationSchema],
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