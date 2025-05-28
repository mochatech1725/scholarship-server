import mongoose, { Document, Schema } from 'mongoose';
import { IRecommendation } from './Recommendation';
import { IEssay } from './Essay';

export interface IApplication extends Document {
  scholarshipId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  scholarshipName: string;
  targetType: string;
  company: string;
  companyWebsite: string;
  platform: string;
  applicationLink: string;
  theme: string;
  amount: number;
  renewable: boolean;
  recommendations: IRecommendation[];
  essays: IEssay[];
  documentInfoLink: string;
  currentAction: string;
  status: string;
  submissionDate?: Date;
  openDate: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  scholarshipId: {
    type: Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  scholarshipName: {
    type: String,
    required: true,
    trim: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['merit', 'need', 'both']
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
    required: true,
    trim: true
  },
  applicationLink: {
    type: String,
    required: true,
    trim: true
  },
  theme: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  renewable: {
    type: Boolean,
    default: false
  },
  recommendations: [{
    type: Schema.Types.ObjectId,
    ref: 'Recommendation'
  }],
  essays: [{
    type: Schema.Types.ObjectId,
    ref: 'Essay'
  }],
  documentInfoLink: {
    type: String,
    trim: true
  },
  currentAction: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'in_progress', 'submitted', 'awarded', 'rejected'],
    default: 'draft'
  },
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