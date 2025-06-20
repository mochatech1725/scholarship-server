import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IScholarship extends Document {
  scholarshipId: string;
  name: string;
  organization: string;
  description: string;
  amount: number;
  deadline: Date;
  targetType: string;
  theme: string;
  requirements: string;
  url: string;
  isActive: boolean;
}

const ScholarshipSchema: Schema = new Schema({
  scholarshipId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
  },
  deadline: {
    type: Date,
  },
  targetType: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  requirements: {
    type: String,
  },
  url: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IScholarship>('Scholarship', ScholarshipSchema); 