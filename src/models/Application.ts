import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Awarded' | 'Not Awarded';
export type TargetType = 'Merit' | 'Need' | 'Both';

export interface IApplication extends Document {
  applicationId: string;
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
  documentInfoLink: string;
  currentAction: string;
  status: ApplicationStatus;
  essays: mongoose.Types.ObjectId[];
  recommendations: mongoose.Types.ObjectId[];
  submissionDate: Date;
  openDate: Date;
  dueDate: Date;
}

const ApplicationSchema: Schema = new Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
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
  essays: [{
    type: Schema.Types.ObjectId,
    ref: 'Essay'
  }],
  recommendations: [{
    type: Schema.Types.ObjectId,
    ref: 'Recommendation'
  }],
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