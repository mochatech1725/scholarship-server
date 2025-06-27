import mongoose, { Document, Schema } from 'mongoose';
import Essay from './Essay.js';
import Recommender from './Recommender.js';

export type ApplicationStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Awarded' | 'Not Awarded';
export type TargetType = 'Merit' | 'Need' | 'Both';
export type RecommendationStatus = 'Pending' | 'Submitted';
export type SubmissionMethod = 'DirectEmail' | 'StudentUpload' | 'DirectMail';

// Clone the Essay schema for embedding (remove timestamps and _id)
const EmbeddedEssaySchema = new Schema(Essay.schema.obj, { 
  _id: false,
  timestamps: false 
});

// Clone the Recommender schema for embedding
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
    enum: ['Pending', 'Submitted'],
    default: 'Pending'
  },
  submissionMethod: {
    type: String,
    enum: ['DirectEmail', 'StudentUpload', 'DirectMail'],
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
  targetType: TargetType;
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
  status: ApplicationStatus;
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
    enum: ['Merit', 'Need', 'Both']
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
    enum: ['Not Started', 'In Progress', 'Submitted', 'Awarded', 'Not Awarded'],
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